/**
 * Roles that an user can inherit.
 */
export enum Role {
  /**
   * Every user has this role by default.
   */
  MEMBER = "member",
  /**
   * The role that an user has when they are the president.
   */
  PRESIDENT = "president",
  /**
   * The role that an user has when they are the vice president.
   */
  VICE_PRESIDENT = "vice_president",
  /**
   * The role that an user has when they are the treasurer.
   */
  TREASURER = "treasurer",
  /**
   * The role that an user has when they are the project manager.
   */
  PROJECT_MANAGER = "project_manager",
  /**
   * The role that an user has when they are SE&RM approved.
   */
  SERM_APPROVED = "serm",
}
