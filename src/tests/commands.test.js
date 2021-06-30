import Bot from 'bot';

let client;
let test;

beforeAll(async () => {
  client = new Bot();
  await client.start();

  test = async (name, ...options) =>
    client.commands.get(name).execute({ ...client, options });
});

describe('/help', () => {
  it("displays this bot's commands", async () => {
    const output = await test('help');

    expect(output).toBeDefined();
  });
});

afterAll(() => {
  client.destroy();
});
