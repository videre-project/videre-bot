import fs from 'fs'
import puppeteer from 'puppeteer'
import { MessageEmbed } from 'discord.js'
import { ICommand } from '../types'

const endpoints = {
	modern: [
		'https://datawrapper.dwcdn.net/Z30uF',
		'https://datawrapper.dwcdn.net/NERr1',
	],
	legacy: [
			'https://datawrapper.dwcdn.net/kHBdR',
			'https://datawrapper.dwcdn.net/kitO7',
	],
};

class Fetch implements ICommand {
  public name = 'fetch'
  public description = 'Fetches and displays format metagame data.'

  async execute({ msg, args }) {
    const [format, variant] = args;
    if (!format) return;

    try {
      const alternate = variant === 'alternate' ? 0 : 1;
  		const url = endpoints[format][alternate];

      const { title, description, file, source } = await grabPage(url, format);

			const embed = new MessageEmbed()
				.setTitle(title)
				.setDescription(description)
				.setURL(url)
				.setColor(0x3498DB)
				.attachFiles([`./temp/${file}.png`])
				.setImage(`attachment://${file}.png`)
				.setTimestamp()
				.setFooter(source, 'https://flaticon.com/dist/min/img/landing/gsuite/sheets.svg');

      await msg.channel.send(embed);

  		return fs.unlinkSync(`./temp/${file}.png`);
    } catch (error) {
      console.error(`${msg.author.username}: ${msg.content} >> ${error.stack}`)
      return msg.channel.send(`An error occured while fetching ${format} data.\n\`${error.message}\``)
    }
  }
}

export default Fetch

const grabPage = async (url: string, format: string) => {
  const browser = await puppeteer.launch({
		headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });

  const page = await browser.newPage();
  await page.goto(url);

  page.setViewport({
    width: 1200,
    height: 722,
  });

  await page.waitForSelector('.table-scroll');

	const properties = await page.evaluate(() => {
		document.getElementById('chart').style.color = '#FFFFFF';
		document.getElementById('chart').style.background = '#2f3136';

		document.querySelectorAll('tr:not(:first-child) td')
			.forEach(elem => (<HTMLElement>elem).style.borderTop = '1px solid rgba(255, 255, 255, 0.08)');
		document.querySelectorAll('th')
			.forEach(elem => (<HTMLElement>elem).style.borderBottom = '2px solid #797064');

		const title = (<HTMLElement>document.querySelector('.headline-block')).innerText;
		const description = (<HTMLElement>document.querySelector('.description-block')).innerText.replace('. ', '.\n');
		const source = (<HTMLElement>document.querySelector('.source-block')).innerText;

		return { title, description, source };
	});

	const file = `${format}-${Date.parse(`${new Date()}`)}`;

  await page.screenshot({
    path: `./temp/${file}.png`,
    clip: {
      x: 0,
      y: 125,
      width: 750,
      height: 525,
    },
  });

  await browser.close();

	return { file, ...properties };
}
