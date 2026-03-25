/** Shape passed to DeleteUserModal and used in UsersTab */
export interface DeleteUserTarget {
  id: string;
  display_name: string;
  username: string;
  email: string;
}

/** Shape passed to ActionReportModal and used in ReportsTab */
export interface ActionReportTarget {
  id: string;
  content_type: string;
  reason: string;
}
