import { Prisma, PrismaClient } from "@prisma/client"
import { ISODateString } from "next-auth"
import { conversationPopulated, participantPopulated } from "../graphql/resolvers/conversation"
import { Context } from "graphql-ws"
import { PubSub } from "graphql-subscriptions"
import { messagePopulated } from "../graphql/resolvers/message"

/**
 * Server Configuration
 */
export interface GraphQLContext {
	session: Session | null
	prisma: PrismaClient
	pubsub: PubSub
}

/*
	Users
*/
export interface Session {
	user: User
	expires: ISODateString
}

export interface SubscriptionContext extends Context {
	connectionParams: {
		session?: Session
	}
}

export interface User {
	id: string
	username: string
	image: string
	email: string
	emailVerified: boolean
	name: string
}

export interface CreateUsernameResponse {
	success?: boolean
	error?: string
}

// Conversations
export type ConversationPopulated = Prisma.ConversationGetPayload<{
	include: typeof conversationPopulated
}>

export type participantPopulated = Prisma.ConversationParticipantGetPayload<{
	include: typeof participantPopulated
}>

export interface ConversationCreatedSubscriptionPayload {
	conversationCreated: ConversationPopulated
}

export interface ConversationUpdatedSubscriptionPayload {
	conversationUpdated: {
		conversation: ConversationPopulated
	}
}

export interface ConversationDeletedSubscriptionPayload {
	conversationDeleted: ConversationPopulated
}

/**
 * Messages
 */
export interface sendMessageArguments {
	id: string
	conversationId: string
	senderId: string
	body: string
}

export interface MessageSentSubscriptionPayload {
	messageSent: MessagePopulated
}

export type MessagePopulated = Prisma.MessageGetPayload<{ include: typeof messagePopulated }>
