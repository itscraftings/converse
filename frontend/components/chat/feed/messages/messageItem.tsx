import { MessagePopulated } from "@/../backend/util/types"
import { formatRelative } from "date-fns"
import { enUS } from "date-fns/locale"
import { Avatar, Box, Flex, Stack, Text } from "@chakra-ui/react"

interface MessageItemProps {
	message: MessagePopulated
	sentByMe: boolean
}

const formatRelativeLocale = {
	lastWeek: "eeee 'at' p",
	yesterday: "'Yesterday at' p",
	today: "p",
	other: "MM/dd/yy"
}

export default function MessageItem({ message, sentByMe }: MessageItemProps) {
	return (
		<Stack
			direction="row"
			p={4}
			spacing={4}
			justify={sentByMe ? "flex-end" : "flex-start"}
			wordBreak="break-word"
		>
			{!sentByMe && (
				<Flex align="flex-end">
					<Avatar size="sm" />
				</Flex>
			)}

			<Stack spacing={1} width="100%">
				<Stack direction="row" align="center" justify={sentByMe ? "flex-end" : "flex-start"}>
					{!sentByMe && (
						<Text fontWeight={500} textAlign="left">
							{message.sender.username}
						</Text>
					)}
					<Text fontSize={14} color="whiteAlpha.700">
						{formatRelative(message.createdAt, new Date(), {
							locale: {
								...enUS,
								formatRelative(token) {
									return formatRelativeLocale[token as keyof typeof formatRelativeLocale]
								}
							}
						})}
					</Text>
				</Stack>
				<Flex justify={sentByMe ? "flex-end" : "flex-start"}>
					<Box
						cursor="pointer"
						bg={sentByMe ? "brand.100" : "whiteAlpha.300"}
						px={2}
						py={1}
						borderRadius={12}
						maxWidth="65%"
					>
						<Text>{message.body}</Text>
					</Box>
				</Flex>
			</Stack>
		</Stack>
	)
}
