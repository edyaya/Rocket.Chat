import { IThreadMessage } from '@rocket.chat/core-typings';
import {
	Skeleton,
	ThreadMessage as ThreadMessageTemplate,
	ThreadMessageRow,
	ThreadMessageLeftContainer,
	ThreadMessageIconThread,
	ThreadMessageContainer,
	ThreadMessageOrigin,
	ThreadMessageBody,
	ThreadMessageUnfollow,
	CheckBox,
	MessageStatusIndicatorItem,
} from '@rocket.chat/fuselage';
import colors from '@rocket.chat/fuselage-tokens/colors';
import { useTranslation } from '@rocket.chat/ui-contexts';
import React, { FC } from 'react';

import { MessageTypes } from '../../../../../app/ui-utils/client';
import UserAvatar from '../../../../components/avatar/UserAvatar';
import { useMessageActions } from '../../contexts/MessageContext';
import { useShowTranslated } from '../contexts/MessageListContext';
import { useIsSelecting, useToggleSelect, useIsSelectedMessage, useCountSelected } from '../contexts/SelectedMessagesContext';
import { useMessageBody } from '../hooks/useMessageBody';
import { useParentMessage } from '../hooks/useParentMessage';
import ThreadMessagePreviewBody from './ThreadMessagePreviewBody';

const ThreadMessagePreview: FC<{ message: IThreadMessage; sequential: boolean }> = ({ message, sequential, ...props }) => {
	const {
		actions: { openThread },
	} = useMessageActions();
	const parentMessage = useParentMessage(message.tmid);
	const body = useMessageBody(parentMessage.data);
	const translated = useShowTranslated(message);
	const t = useTranslation();

	const isSelecting = useIsSelecting();
	const toggleSelected = useToggleSelect(message._id);
	const isSelected = useIsSelectedMessage(message._id);
	useCountSelected();

	const messageType = parentMessage.isSuccess ? MessageTypes.getType(parentMessage.data) : null;

	return (
		<ThreadMessageTemplate
			{...props}
			onClick={isSelecting ? toggleSelected : undefined}
			isSelected={isSelected}
			data-qa-selected={isSelected}
		>
			{!sequential && (
				<ThreadMessageRow>
					<ThreadMessageLeftContainer>
						<ThreadMessageIconThread />
					</ThreadMessageLeftContainer>
					<ThreadMessageContainer>
						<ThreadMessageOrigin system={!!messageType}>
							{parentMessage.isSuccess && !messageType && (
								<>
									<ThreadMessagePreviewBody message={{ ...parentMessage.data, msg: body }} />
									{translated && (
										<>
											{' '}
											<MessageStatusIndicatorItem name='language' color={colors.p500} title={t('Translated')} />
										</>
									)}
								</>
							)}
							{messageType && t(messageType.message, messageType.data ? messageType.data(message) : {})}
							{parentMessage.isLoading && <Skeleton />}
						</ThreadMessageOrigin>
						<ThreadMessageUnfollow />
					</ThreadMessageContainer>
				</ThreadMessageRow>
			)}
			<ThreadMessageRow
				onClick={!(message as { ignored?: boolean }).ignored && !isSelecting ? openThread(message.tmid, message._id) : undefined}
			>
				<ThreadMessageLeftContainer>
					{!isSelecting && <UserAvatar username={message.u.username} size='x18' />}
					{isSelecting && <CheckBox checked={isSelected} onChange={toggleSelected} />}
				</ThreadMessageLeftContainer>
				<ThreadMessageContainer>
					<ThreadMessageBody>
						{(message as { ignored?: boolean }).ignored ? (
							t('Message_Ignored')
						) : (
							<>
								<ThreadMessagePreviewBody message={message} />
								{translated && (
									<>
										{' '}
										<MessageStatusIndicatorItem name='language' title={t('Translated')} />
									</>
								)}
							</>
						)}
					</ThreadMessageBody>
				</ThreadMessageContainer>
			</ThreadMessageRow>
		</ThreadMessageTemplate>
	);
};

export default ThreadMessagePreview;
