import { ConversationPopulated, MessagePopulated } from "@/../backend/util/types"

// Users
export interface CreateUsernameData {
	createUsername: {
		success: boolean
		error: string
	}
}

export interface CreateUsernameVariables {
	username: string
}

export interface SearchUsersInput {
	username: string
}

export interface SearchUsersData {
	searchUsers: SearchedUser[]
}

export interface SearchedUser {
	id: string
	username: string
}

// Conversations
export interface ConversationsData {
	conversations: ConversationPopulated[]
}

export interface CreateConversationData {
	createConversation: {
		conversationId: string
	}
}

export interface CreateConversationInput {
	participantIds: string[]
}

export interface ConversationUpdatedData {
	conversationUpdated: {
		conversation: ConversationPopulated
	}
}

export interface ConversationDeletedData {
	conversationDeleted: {
		id: string
	}
}

/**
 * Messages
 */
export interface MessagesData {
	messages: MessagePopulated[]
}

export interface MessagesVariables {
	conversationId: string
}

export interface MessageSubscriptionData {
	subscriptionData: {
		data: {
			messageSent: MessagePopulated
		}
	}
}
