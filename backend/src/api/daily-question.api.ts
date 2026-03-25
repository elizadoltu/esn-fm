import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { pool } from '../db/pool.js';
import { createNotification } from '../db/notifications.js';

export async function getActiveDailyQuestion(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const result = await pool.query(
      `SELECT id, content, published_at FROM daily_questions WHERE is_active = TRUE LIMIT 1`
    );

    if (result.rows.length === 0) {
      res.json(null);
      return;
    }

    const dq = result.rows[0];

    // If authenticated, attach the user's own answer
    const auth = req.headers.authorization;
    let myAnswer: Record<string, unknown> | null = null;
    if (auth?.startsWith('Bearer ')) {
      try {
        const payload = jwt.verify(auth.slice(7), process.env.JWT_SECRET!) as unknown as {
          id: string;
        };
        const myRow = await pool.query(
          `SELECT id, content, show_on_feed, created_at
           FROM daily_question_answers
           WHERE daily_question_id = $1 AND author_id = $2`,
          [dq.id, payload.id]
        );
        if (myRow.rows.length > 0) myAnswer = myRow.rows[0];
      } catch {
        // invalid token — ignore
      }
    }

    res.json({ ...dq, my_answer: myAnswer });
  } catch (err) {
    next(err);
  }
}

export async function getActiveDailyQuestionAnswers(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const limit = Math.min(Number(req.query.limit) || 20, 50);
    const offset = Number(req.query.offset) || 0;

    const dq = await pool.query(`SELECT id FROM daily_questions WHERE is_active = TRUE LIMIT 1`);
    if (dq.rows.length === 0) {
      res.json({ items: [], limit, offset });
      return;
    }

    const dqId = dq.rows[0].id;

    // Resolve optional viewer
    let viewerId: string | null = null;
    const auth = req.headers.authorization;
    if (auth?.startsWith('Bearer ')) {
      try {
        const payload = jwt.verify(auth.slice(7), process.env.JWT_SECRET!) as unknown as {
          id: string;
        };
        viewerId = payload.id;
      } catch {
        // ignore
      }
    }

    const result = await pool.query(
      `SELECT
         a.id, a.content, a.show_on_feed, a.created_at,
         u.username AS author_username,
         u.display_name AS author_display_name,
         u.avatar_url AS author_avatar_url,
         COUNT(DISTINCT l.user_id)::int AS likes,
         BOOL_OR(l.user_id = $3) AS liked_by_me,
         COUNT(DISTINCT c.id)::int AS comment_count
       FROM daily_question_answers a
       JOIN users u ON u.id = a.author_id
       LEFT JOIN daily_question_answer_likes l ON l.daily_answer_id = a.id
       LEFT JOIN daily_question_answer_comments c ON c.daily_answer_id = a.id AND c.is_deleted = FALSE
       WHERE a.daily_question_id = $1
         AND a.show_on_feed = TRUE
       GROUP BY a.id, a.content, a.show_on_feed, a.created_at,
                u.username, u.display_name, u.avatar_url
       ORDER BY a.created_at DESC
       LIMIT $2 OFFSET $4`,
      [dqId, limit, viewerId, offset]
    );

    res.json({ items: result.rows, limit, offset });
  } catch (err) {
    next(err);
  }
}

export async function answerDailyQuestion(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { id } = req.params;
    const userId = req.user!.id;
    const content = (req.body.content as string | undefined)?.trim();
    const showOnFeed = req.body.show_on_feed !== false;

    if (!content || content.length === 0) {
      res.status(400).json({ error: 'Content is required' });
      return;
    }
    if (content.length > 1000) {
      res.status(400).json({ error: 'Content must be 1000 characters or fewer' });
      return;
    }

    const dq = await pool.query(
      `SELECT id FROM daily_questions WHERE id = $1 AND is_active = TRUE`,
      [id]
    );
    if (dq.rows.length === 0) {
      res.status(404).json({ error: 'Active question not found' });
      return;
    }

    const result = await pool.query(
      `INSERT INTO daily_question_answers (daily_question_id, author_id, content, show_on_feed)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (daily_question_id, author_id)
       DO UPDATE SET content = EXCLUDED.content, show_on_feed = EXCLUDED.show_on_feed
       RETURNING id, content, show_on_feed, created_at`,
      [id, userId, content, showOnFeed]
    );

    res.status(201).json(result.rows[0]);
  } catch (err) {
    next(err);
  }
}

export async function toggleDailyAnswerLike(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { id } = req.params;
    const userId = req.user!.id;

    const answer = await pool.query(`SELECT author_id FROM daily_question_answers WHERE id = $1`, [
      id,
    ]);
    if (answer.rows.length === 0) {
      res.status(404).json({ error: 'Answer not found' });
      return;
    }

    const existing = await pool.query(
      `SELECT 1 FROM daily_question_answer_likes WHERE user_id = $1 AND daily_answer_id = $2`,
      [userId, id]
    );

    if (existing.rows.length > 0) {
      await pool.query(
        `DELETE FROM daily_question_answer_likes WHERE user_id = $1 AND daily_answer_id = $2`,
        [userId, id]
      );
      res.json({ liked: false });
    } else {
      await pool.query(
        `INSERT INTO daily_question_answer_likes (user_id, daily_answer_id) VALUES ($1, $2)`,
        [userId, id]
      );
      const authorId = answer.rows[0].author_id as string;
      await createNotification(authorId, 'new_like', id, userId);
      res.json({ liked: true });
    }
  } catch (err) {
    next(err);
  }
}

export async function getDailyAnswerComments(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { id } = req.params;
    const result = await pool.query(
      `SELECT c.id, c.content, c.created_at,
              u.username AS author_username,
              u.display_name AS author_display_name,
              u.avatar_url AS author_avatar_url
       FROM daily_question_answer_comments c
       JOIN users u ON u.id = c.author_id
       WHERE c.daily_answer_id = $1 AND c.is_deleted = FALSE
       ORDER BY c.created_at ASC`,
      [id]
    );
    res.json(result.rows);
  } catch (err) {
    next(err);
  }
}

export async function postDailyAnswerComment(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { id } = req.params;
    const userId = req.user!.id;
    const content = (req.body.content as string | undefined)?.trim();

    if (!content || content.length === 0) {
      res.status(400).json({ error: 'Content is required' });
      return;
    }
    if (content.length > 200) {
      res.status(400).json({ error: 'Comment must be 200 characters or fewer' });
      return;
    }

    const answer = await pool.query(`SELECT author_id FROM daily_question_answers WHERE id = $1`, [
      id,
    ]);
    if (answer.rows.length === 0) {
      res.status(404).json({ error: 'Answer not found' });
      return;
    }

    const result = await pool.query(
      `INSERT INTO daily_question_answer_comments (daily_answer_id, author_id, content)
       VALUES ($1, $2, $3)
       RETURNING id, content, created_at`,
      [id, userId, content]
    );

    const authorId = answer.rows[0].author_id as string;
    await createNotification(authorId, 'new_comment', id, userId);

    res.status(201).json(result.rows[0]);
  } catch (err) {
    next(err);
  }
}

export async function getDailyQuestionArchive(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const limit = Math.min(Number(req.query.limit) || 20, 50);
    const offset = Number(req.query.offset) || 0;

    const result = await pool.query(
      `SELECT dq.id, dq.content, dq.published_at,
              COUNT(dqa.id)::int AS answer_count
       FROM daily_questions dq
       LEFT JOIN daily_question_answers dqa ON dqa.daily_question_id = dq.id
       WHERE dq.is_active = FALSE AND dq.published_at IS NOT NULL
       GROUP BY dq.id, dq.content, dq.published_at
       ORDER BY dq.published_at DESC
       LIMIT $1 OFFSET $2`,
      [limit, offset]
    );

    res.json({ items: result.rows, limit, offset });
  } catch (err) {
    next(err);
  }
}

export async function getUserDailyAnswers(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { username } = req.params;

    const userRow = await pool.query(`SELECT id FROM users WHERE username = $1`, [username]);
    if (userRow.rows.length === 0) {
      res.status(404).json({ error: 'User not found' });
      return;
    }
    const profileUserId = userRow.rows[0].id as string;

    // Resolve optional viewer to check ownership
    let viewerId: string | null = null;
    const auth = req.headers.authorization;
    if (auth?.startsWith('Bearer ')) {
      try {
        const payload = jwt.verify(auth.slice(7), process.env.JWT_SECRET!) as unknown as {
          id: string;
        };
        viewerId = payload.id;
      } catch {
        /* ignore */
      }
    }

    const isOwner = viewerId === profileUserId;

    const result = await pool.query(
      `SELECT
         dqa.id, dqa.content, dqa.show_on_feed, dqa.created_at,
         dq.id AS daily_question_id, dq.content AS question, dq.published_at,
         COUNT(DISTINCT l.user_id)::int AS likes,
         BOOL_OR(l.user_id = $3) AS liked_by_me,
         COUNT(DISTINCT c.id)::int AS comment_count
       FROM daily_question_answers dqa
       JOIN daily_questions dq ON dq.id = dqa.daily_question_id
       LEFT JOIN daily_question_answer_likes l ON l.daily_answer_id = dqa.id
       LEFT JOIN daily_question_answer_comments c ON c.daily_answer_id = dqa.id AND c.is_deleted = FALSE
       WHERE dqa.author_id = $1
         AND ($2 = TRUE OR dqa.show_on_feed = TRUE)
       GROUP BY dqa.id, dqa.content, dqa.show_on_feed, dqa.created_at,
                dq.id, dq.content, dq.published_at
       ORDER BY dqa.created_at DESC`,
      [profileUserId, isOwner, viewerId]
    );

    res.json(result.rows);
  } catch (err) {
    next(err);
  }
}

export async function getDailyQuestionById(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { id } = req.params;
    const result = await pool.query(
      `SELECT dq.id, dq.content, dq.published_at, dq.is_active,
              COUNT(dqa.id)::int AS answer_count
       FROM daily_questions dq
       LEFT JOIN daily_question_answers dqa ON dqa.daily_question_id = dq.id
       WHERE dq.id = $1 AND dq.published_at IS NOT NULL
       GROUP BY dq.id, dq.content, dq.published_at, dq.is_active`,
      [id]
    );

    if (result.rows.length === 0) {
      res.status(404).json({ error: 'Question not found' });
      return;
    }

    res.json(result.rows[0]);
  } catch (err) {
    next(err);
  }
}

export async function getDailyQuestionAnswersById(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { id } = req.params;
    const limit = Math.min(Number(req.query.limit) || 20, 50);
    const offset = Number(req.query.offset) || 0;

    // Resolve optional viewer for liked_by_me
    let viewerId: string | null = null;
    const auth = req.headers.authorization;
    if (auth?.startsWith('Bearer ')) {
      try {
        const payload = jwt.verify(auth.slice(7), process.env.JWT_SECRET!) as unknown as {
          id: string;
        };
        viewerId = payload.id;
      } catch {
        /* ignore */
      }
    }

    const result = await pool.query(
      `SELECT
         a.id, a.content, a.created_at,
         u.username AS author_username,
         u.display_name AS author_display_name,
         u.avatar_url AS author_avatar_url,
         COUNT(DISTINCT l.user_id)::int AS likes,
         BOOL_OR(l.user_id = $4) AS liked_by_me,
         COUNT(DISTINCT c.id)::int AS comment_count
       FROM daily_question_answers a
       JOIN users u ON u.id = a.author_id
       LEFT JOIN daily_question_answer_likes l ON l.daily_answer_id = a.id
       LEFT JOIN daily_question_answer_comments c ON c.daily_answer_id = a.id AND c.is_deleted = FALSE
       WHERE a.daily_question_id = $1
         AND a.show_on_feed = TRUE
       GROUP BY a.id, a.content, a.created_at,
                u.username, u.display_name, u.avatar_url
       ORDER BY a.created_at DESC
       LIMIT $2 OFFSET $3`,
      [id, limit, offset, viewerId]
    );

    res.json({ items: result.rows, limit, offset });
  } catch (err) {
    next(err);
  }
}
