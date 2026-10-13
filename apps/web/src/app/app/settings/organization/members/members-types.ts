/** Shared shapes for the members section — kept out of the .tsx to keep files under limits. */
export interface MemberRowData {
  memberId: string;
  userId: string;
  name: string;
  email: string;
  role: string;
}

export interface InvitationRowData {
  id: string;
  email: string;
  role: string;
  expiresAt: Date | null;
  teamName: string | null;
  inviteUrl: string;
}

export interface TeamOption {
  id: string;
  name: string;
}

export interface MembersLabels {
  members: string;
  invite: string;
  inviteTitle: string;
  email: string;
  role: string;
  team: string;
  teamNone: string;
  send: string;
  invited: string;
  inviteLink: string;
  copyLink: string;
  copied: string;
  pending: string;
  expiresAt: string;
  cancel: string;
  canceled: string;
  changeRole: string;
  remove: string;
  removeConfirm: string;
  removed: string;
  roleSaved: string;
  you: string;
}
