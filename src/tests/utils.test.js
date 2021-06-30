import {
  sanitize,
  validateMessage,
  validateEmbed,
  markdown,
  formatPages,
} from 'utils/discord';
import { MESSAGE_LIMITS } from 'constants';
import config from 'config';

describe('utils/discord', () => {
  it('sanitizes Discord mentions', () => {
    const output = sanitize(`${config.prefix}command args <@!1234>`);

    expect(output).toBe(`${config.prefix}command args`);
  });

  it('sanitizes Discord emotes', () => {
    const output = sanitize(`${config.prefix}command args :emote:`);

    expect(output).toBe(`${config.prefix}command args emote`);
  });

  it('sanitizes whitespace', () => {
    const output = sanitize(`${config.prefix}command args  arg2\narg3`);

    expect(output).toBe(`${config.prefix}command args arg2 arg3`);
  });

  it('sanitizes Discord markdown', () => {
    const output = sanitize(`
      ${config.prefix}command args
      *Italics*
      **Bold**
      \`Code\`
      \`\`\`Codeblock\`\`\`
    `);

    expect(output).toBe(`${config.prefix}command args Italics Bold Code Codeblock`);
  });

  it('validates message strings', () => {
    const content = ' '.repeat(MESSAGE_LIMITS.CONTENT_LENGTH + 1);

    const inline = validateMessage(content);
    const explicit = validateMessage({ content });

    expect(inline.content).toBe(explicit.content);
    expect(inline.content.length).toBe(MESSAGE_LIMITS.CONTENT_LENGTH);
    expect(explicit.content.length).toBe(MESSAGE_LIMITS.CONTENT_LENGTH);
  });

  it('validates message embeds', () => {
    const embed = {
      title: ' '.repeat(MESSAGE_LIMITS.TITLE_LENGTH + 1),
      description: ' '.repeat(MESSAGE_LIMITS.DESC_LENGTH + 1),
      fields: new Array(MESSAGE_LIMITS.FIELD_LENGTH + 1).fill({
        name: ' '.repeat(MESSAGE_LIMITS.FIELD_NAME_LENGTH + 1),
        value: ' '.repeat(MESSAGE_LIMITS.FIELD_VALUE_LENGTH + 1),
      }),
    };

    const output = validateEmbed(embed);

    expect(output.title.length).toBe(MESSAGE_LIMITS.TITLE_LENGTH);
    expect(output.description.length).toBe(MESSAGE_LIMITS.DESC_LENGTH);
    expect(output.fields.length).toBe(MESSAGE_LIMITS.FIELD_LENGTH);
    expect(output.fields[0].name.length).toBe(MESSAGE_LIMITS.FIELD_NAME_LENGTH);
    expect(output.fields[0].value.length).toBe(MESSAGE_LIMITS.FIELD_VALUE_LENGTH);
  });

  it('formats items into pages', () => {
    const output = formatPages(new Array(20).fill('item'), {
      title: 'Message Title',
      description: 'Items:',
    });

    expect(output.title).toBe('Message Title');
    expect(output.description).not.toBe('Items:');
    expect(output.buttons).toBeDefined();
  });
});