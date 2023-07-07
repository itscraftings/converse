import { Prisma } from "@prisma/client"
import {
	ConversationDeletedSubscriptionPayload,
	ConversationPopulated,
	GraphQLContext
} from "../../util/types"
import { GraphQLError } from "graphql"
import { withFilter } from "graphql-subscriptions"
import { userIsConversationParticipant } from "../../util/functions"
import { ConversationUpdatedSubscriptionPayload } from "../../util/types"

const resolvers = {
	Query: {
		async conversations(
			_: any,
			__: any,
			{ session, prisma }: GraphQLContext
		): Promise<ConversationPopulated[]> {
			if (!session) {
				throw new GraphQLError("Not authorized")
			}

			try {
				const { id } = session.user

				/**
				 * Find all conversations that a user is part of
				 */
				const conversations = await prisma.conversation.findMany({
					/**
					 * Below has been confirmed to be the correct
					 * query by the Prisma team. Has been confirmed
					 * that there is an isse on their end
					 * Issue seem specific to Mongo
					 */
					// where: {
					// 	participants: {
					// 		some: {
					// 			userId: {
					// 				equals: userId
					// 			}
					// 		}
					// 	}
					// },
					include: conversationPopulated
				})
				/**
				 * Since above query does not work
				 */

				return conversations.filter(
					(conversation: any) => !!conversation.participants.find((p: any) => p.userId === id)
				)
			} catch (error: any) {
				console.log("conversations error", error)
				throw new GraphQLError(error.message)
			}
		}
	},
	Mutation: {
		async createConversation(
			_: any,
			{ participantIds }: { participantIds: string[] },
			{ session, prisma, pubsub }: GraphQLContext
		): Promise<{ conversationId: string }> {
			if (!session) {
				throw new GraphQLError("Not authorized")
			}

			const { id: userId } = session.user

			try {
				const conversation = await prisma.conversation.create({
					data: {
						participants: {
							createMany: {
								data: participantIds.map(id => ({
									userId: id,
									hasSeenLatestMessage: id === userId
								}))
							}
						}
					},
					include: conversationPopulated
				})

				// emit a CONVERSATION_CREATED event using pubsub
				pubsub.publish("CONVERSATION_CREATED", {
					conversationCreated: conversation
				})

				return {
					conversationId: conversation.id
				}
			} catch (error) {
				console.log("createConversation error", error)
				throw new GraphQLError("Error creating a conversation")
			}
		},
		async markConversationAsRead(
			_: any,
			{ userId, conversationId }: { userId: string; conversationId: string },
			{ session, prisma }: GraphQLContext
		): Promise<boolean> {
			if (!session) {
				throw new GraphQLError("Not authorized")
			}

			try {
				const participant = await prisma.conversationParticipant.findFirst({
					where: {
						userId,
						conversationId
					}
				})

				/**
				 * Should always exists but being safe
				 */
				if (!participant) {
					throw new Error("Participant entity not found")
				}

				await prisma.conversationParticipant.update({
					where: {
						id: participant.id
					},
					data: {
						hasSeenLatestMessage: true
					}
				})

				return true
			} catch (error: any) {
				console.log("markConversationAsRead", error)
				throw new GraphQLError(error.message)
			}
		},
		async deleteConversation(
			_: any,
			{ conversationId }: { conversationId: string },
			{ session, prisma, pubsub }: GraphQLContext
		): Promise<boolean> {
			if (!session) {
				throw new GraphQLError("Not authorized")
			}

			try {
				/**
				 * Delete conversation and all related entities
				 */
				const [deletedConversation] = await prisma.$transaction([
					prisma.conversation.delete({
						where: {
							id: conversationId
						},
						include: conversationPopulated
					}),
					prisma.conversationParticipant.deleteMany({
						where: {
							conversationId
						}
					}),
					prisma.message.deleteMany({
						where: {
							conversationId
						}
					})
				])

				pubsub.publish("CONVERSATION_DELETED", {
					conversationDeleted: deletedConversation
				})
			} catch (error) {
				console.log("deleteConversation error", error)
				throw new GraphQLError("Failed to delete a conversation")
			}

			return true
		}
	},
	Subscription: {
		conversationCreated: {
			subscribe: withFilter(
				(_: any, __: any, { pubsub }: GraphQLContext) => {
					return pubsub.asyncIterator(["CONVERSATION_CREATED"])
				},
				({ conversationCreated }: ConversationCreatedSubscriptionPayload, _, { session }: GraphQLContext) => {
					if (!session) {
						throw new GraphQLError("Not authorized")
					}

					const { participants } = conversationCreated

					return userIsConversationParticipant(participants, session.user.id)
				}
			)
		},
		conversationUpdated: {
			subscribe: withFilter(
				(_: any, __: any, { pubsub }: GraphQLContext) => {
					return pubsub.asyncIterator("CONVETRSATION_UPDATED")
				},
				(payload: ConversationUpdatedSubscriptionPayload, _: any, { session }: GraphQLContext) => {
					console.log("HERE IS PAYLOAD:", payload)

					if (!session) {
						throw new GraphQLError("Not authorized")
					}

					const { id: userId } = session.user
					const { participants } = payload.conversationUpdated.conversation

					return userIsConversationParticipant(participants, userId)
				}
			)
		},
		conversationDeleted: {
			subscribe: withFilter(
				(_: any, __: any, { pubsub }: GraphQLContext) => {
					return pubsub.asyncIterator(["CONVERSATION_DELETED"])
				},
				(
					{ conversationDeleted }: ConversationDeletedSubscriptionPayload,
					_: any,
					{ session }: GraphQLContext
				) => {
					if (!session) {
						throw new Error("Not authorized")
					}

					const { id: userId } = session.user
					const { participants } = conversationDeleted

					return userIsConversationParticipant(participants, userId)
				}
			)
		}
	}
}

export interface ConversationCreatedSubscriptionPayload {
	conversationCreated: ConversationPopulated
}

export const participantPopulated = Prisma.validator<Prisma.ConversationParticipantInclude>()({
	user: {
		select: {
			id: true,
			username: true
		}
	}
})

// populateds
export const conversationPopulated = Prisma.validator<Prisma.ConversationInclude>()({
	participants: {
		include: participantPopulated
	},
	latestMessage: {
		include: {
			sender: {
				select: {
					id: true,
					username: true
				}
			}
		}
	}
})

export default resolvers
