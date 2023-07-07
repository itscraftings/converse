import { participantPopulated } from "./types"

export function userIsConversationParticipant(participants: participantPopulated[], userId: string): boolean {
	return !!participants.find(participants => participants.userId === userId)
}
