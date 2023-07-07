import { participantPopulated } from "@/../backend/util/types"

export function formatUsernames(participants: participantPopulated[], myUserId: string): string {
	const usernames = participants
		.filter(participant => participant.user.id != myUserId)
		.map(participant => participant.user.username)

	return usernames.join(", ")
}
