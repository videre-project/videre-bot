<!-- Banner Image -->
<h3 align="center">
	<a href="#"> <!-- Prevents Github from linking banner to source on click -->
		<img
		alt="Videre Bot"
		src="./bin/Github Banner.png">
	</a>
</h3>

<!-- Main Title -->
<h2 align="center">
	The <b>Videre Project</b> Discord Bot
	for <em>Magic: The Gathering</em>.
</h2>

<!-- Links Ribbon -->
<p align="center">
	<strong>
	<a href="https://videreproject.com/videre-bot">Website <code>(WIP)</code></a>
	•
	<!-- To Do --><a href="https://github.com/videre-project/videre-project/wiki/Videre-Bot">Docs <code>(WIP)</code></a>
	•
	<a href="#">
		<img
		width="15"
		src="./bin/Discord Logo.png">
	</a>
	<a href="https://discord.gg/MBGatsNNSj">Discord</a>
	•
	<!-- To Do --><a href='https://github.com/videre-project/videre-project/issues?q=is:issue+is:open+label:"service: videre-bot"'>Issue Tracker <code>(WIP)</code></a>
	•
	<!-- To Do --><a href="https://github.com/videre-project/videre-project/blob/main/services/videre-bot/CONTRIBUTING.md">Contribute</a>
	•
	<a href="https://github.com/videre-project/videre-project/blob/main/services/videre-bot/LICENSE">License</a>
	</strong>
</p>

## Table of contents
- [Install and Run](#install--run)
	- [Installing dependencies](#install-dependencies-with)
	- [Starting the Bot](#start-the-bot-with)
	- [Running Tests](#run-tests-with)
- [Commands](#commands)
	- [Catalog](#catalog)
	- [Debug](#debug)
	- [Decklist](#decklist)
	- [Event](#event)
	- [Help](#help)
	- [Hypergeo](#hypergeo)
	- [Quote](#quote)

## Install & run

⚠️ Make sure you have [NodeJS](https://nodejs.org/en/download/) and [Yarn](https://yarnpkg.com/getting-started/install/) installed.

#### Install dependencies with:

```shell
$ yarn
```

<details><summary>Manual Installation Steps</summary>
<p>
```bash
(WIP)
```
</p>
</details>

#### Start the bot with:

```shell
$ yarn start
```
or
```shell
$ nodemon --exec babel-node src
```

#### Run tests with:

```shell
$ yarn test
```

## Commands
Command | Options | Description
--- | --- | ---
   /catalog | `format` `event_type` `date` | (WIP) Displays most recent events by format, type, and/or date.
   /debug | | Displays the bot's current uptime, cluster info, and latency.
   /decklist | `decklist_url` | (WIP) Display decklist(s) by url or filtered by format, archetype, player, and/or query.
   /event | `event_id` `view (optional)` | (WIP) Displays an event by name, id, date, or search query.
   /help | | Displays this bot's commands.
   /hypergeo | `pop_size` `pop_successes` `sample_size` `desired_successes` | Solves a hypergeometric distribution.
   /quote | `message_link` | Quotes a message by a provided message link.

<details><summary>Show a detailed breakdown of all commands</summary>

### /catalog
(WIP) Displays most recent events by format, type, and/or date.
<br><br>Usage: <b>`/catalog`</b> `format:modern` `event_type: challenge` `date: 07/04/2021`

### /debug
Displays the bot's current uptime, cluster info, and latency.
<br><br>Usage: <b>`/debug`</b>

### /decklist
(WIP) Display decklist(s) by url or filtered by format, archetype, player, and/or query.
<br><br>Usage: <b>`/decklist`</b> `decklist_url: https://www.mtggoldfish.com/deck/432172#paper`

### /event
(WIP) Displays an event by name, id, date, or search query.
<br><br>Usage: <b>`/event`</b> `event_id: 12299475` `view: Decklist View`

### /help
Displays a list of this bot's commands.
<br><br>Usage: <b>`/help`</b>

### /hypergeo
Solves a hypergeometric distribution.
<br><br>Usage: <b>`/hypergeo`</b> `pop_size: 60` `pop_successes: 24` `sample_size: 7` `desired_successes: 4`

### /quote
Quotes a message by a provided message link.
<br><br>Usage: <b>`/quote`</b> `message_link:https://discord.com/channels/772093785176801310/810281825691107389/863256006887473162`

</details>

