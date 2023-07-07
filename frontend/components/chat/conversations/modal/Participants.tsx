import { SearchedUser } from "@/util/types"
import { Flex, Stack, Text } from "@chakra-ui/react"
import { IoIosCloseCircleOutline } from "react-icons/io"

interface Participants {
	participants: SearchedUser[]
	removeParticipant(usedId: string): void
}

export default function Participants({ participants, removeParticipant }: Participants) {
	return (
		<Flex mt={8} gap="10px" flexWrap="wrap">
			{participants.map(participant => (
				<Stack direction="row" key={participant.id} align="center" bg="whiteAlpha.200" borderRadius={4} p={2}>
					<Text>{participant.username}</Text>

					<IoIosCloseCircleOutline
						size={20}
						cursor="pointer"
						// @ts-ignore
						onClick={() => removeParticipant(participant.id)}
					/>
				</Stack>
			))}
		</Flex>
	)
}
