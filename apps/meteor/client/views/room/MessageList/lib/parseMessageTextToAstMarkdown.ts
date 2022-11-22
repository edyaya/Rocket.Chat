import {
	IMessage,
	isE2EEMessage,
	isOTRMessage,
	isQuoteAttachment,
	isTranslatedMessage,
	MessageAttachment,
	MessageQuoteAttachment,
} from '@rocket.chat/core-typings';
import { Options, parse, Root } from '@rocket.chat/message-parser';

import { AutoTranslateOptions } from '../hooks/useAutoTranslate';
import { isParsedMessage } from './isParsedMessage';

type WithRequiredProperty<Type, Key extends keyof Type> = Omit<Type, Key> & {
	[Property in Key]-?: Type[Property];
};

export type MessageWithMdEnforced = WithRequiredProperty<IMessage, 'md'>;
/*
 * Removes null values for known properties values.
 * Adds a property `md` to the message with the parsed message if is not provided.
 * if has `attachments` property, but attachment is missing `md` property, it will be added.
 * if translation is enabled and message contains `translations` property, it will be replaced by the parsed message.
 * @param message The message to be parsed.
 * @param parseOptions The options to be used in the parser.
 * @param autoTranslateOptions The auto translate options to be used in the parser.
 * @returns message normalized.
 */

export const parseMessageTextToAstMarkdown = (
	message: IMessage,
	parseOptions: Options,
	autoTranslateOptions: AutoTranslateOptions,
): MessageWithMdEnforced => {
	const msg = removePossibleNullMessageValues(message);
	const { showAutoTranslate, autoTranslateLanguage } = autoTranslateOptions;
	const translations = autoTranslateLanguage && isTranslatedMessage(msg) && msg.translations;
	const translated = showAutoTranslate(message);

	const text = (translated && translations && translations[autoTranslateLanguage]) || msg.msg;

	return {
		...msg,
		md:
			isE2EEMessage(message) || isOTRMessage(message) || translated
				? textToMessageToken(text, parseOptions)
				: msg.md ?? textToMessageToken(text, parseOptions),
		...(msg.attachments && {
			attachments: parseMessageAttachments(msg.attachments, parseOptions, { autoTranslateLanguage, translated }),
		}),
	};
};

export const parseMessageQuoteAttachment = <T extends MessageQuoteAttachment>(
	quote: T,
	parseOptions: Options,
	autoTranslateOptions: { autoTranslateLanguage?: string; translated: boolean },
): T => {
	const { translated, autoTranslateLanguage } = autoTranslateOptions;
	if (quote.attachments && quote.attachments?.length > 0) {
		quote.attachments = quote.attachments.map((attachment) => parseMessageQuoteAttachment(attachment, parseOptions, autoTranslateOptions));
	}

	const text = (translated && autoTranslateLanguage && quote?.translations?.[autoTranslateLanguage]) || quote.text || '';

	return {
		...quote,
		md: translated ? textToMessageToken(text, parseOptions) : quote.md ?? textToMessageToken(text, parseOptions),
	};
};

export const parseMessageAttachments = <T extends MessageAttachment>(
	attachments: T[],
	parseOptions: Options,
	autoTranslateOptions: { autoTranslateLanguage?: string; translated: boolean },
): T[] =>
	attachments.map((attachment) => {
		const { translated, autoTranslateLanguage } = autoTranslateOptions;
		if (!attachment.text && !attachment.description) {
			return attachment;
		}

		if (isQuoteAttachment(attachment) && attachment.attachments) {
			attachment.attachments = attachment.attachments.map((quoteAttachment) =>
				parseMessageQuoteAttachment(quoteAttachment, parseOptions, autoTranslateOptions),
			);
		}

		const text =
			(translated && autoTranslateLanguage && attachment?.translations?.[autoTranslateLanguage]) ||
			attachment.text ||
			attachment.description ||
			'';

		return {
			...attachment,
			md: translated ? textToMessageToken(text, parseOptions) : attachment.md ?? textToMessageToken(text, parseOptions),
		};
	});

const isNotNullOrUndefined = (value: unknown): boolean => value !== null && value !== undefined;

// In a previous version of the app, some values were being set to null.
// This is a workaround to remove those null values.
// A migration script should be created to remove this code.
export const removePossibleNullMessageValues = ({
	editedBy,
	editedAt,
	emoji,
	avatar,
	alias,
	customFields,
	groupable,
	attachments,
	reactions,
	...message
}: any): IMessage => ({
	...message,
	...(isNotNullOrUndefined(editedBy) && { editedBy }),
	...(isNotNullOrUndefined(editedAt) && { editedAt }),
	...(isNotNullOrUndefined(emoji) && { emoji }),
	...(isNotNullOrUndefined(avatar) && { avatar }),
	...(isNotNullOrUndefined(alias) && { alias }),
	...(isNotNullOrUndefined(customFields) && { customFields }),
	...(isNotNullOrUndefined(groupable) && { groupable }),
	...(isNotNullOrUndefined(attachments) && { attachments }),
	...(isNotNullOrUndefined(reactions) && { reactions }),
});

const textToMessageToken = (textOrRoot: string | Root, parseOptions: Options): Root => {
	if (!textOrRoot) {
		return [];
	}

	if (isParsedMessage(textOrRoot)) {
		return textOrRoot;
	}

	return parse(textOrRoot, parseOptions);
};
