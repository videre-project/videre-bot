<h3 align="center">
	<a href="#"> <!-- Prevents Github from linking banner to source on click -->
		<img
		alt="Videre Bot"
		src="/public/Github_Banner.png">
	</a>
</h3>

<h3 align="center">
	Official Discord bot from the Videre Project for Magic: The Gathering. 
</h3>

<p align="center">
	<strong>
	<a href="https://videreproject.com/">Website</a>
	•
	<!-- To Do --><a href="https://github.com/videre-project/videre-bot/wiki">Docs</a>
	•
	<a href="#">
		<img
		width="15"
		src="/public/Discord_Logo.png">
	</a>
	<a href="https://discord.gg/MBGatsNNSj">Discord</a>
	•
	<!-- To Do --><a href="https://github.com/videre-project/videre-bot/issues">Issue Tracker</a>
	•
	<!-- To Do --><a href="https://github.com/videre-project/videre-bot/blob/main/CONTRIBUTING.md">Contribute</a>
	•
	<a href="https://github.com/videre-project/videre-bot/blob/main/LICENSE">License</a>
	</strong>
</p>


## Table of contents
- [Install and Run](#install--run)
- [Commands](#commands)
    - [Event](#event)
    - [Help](#help)

## Install & run

Make sure you have nodejs and yarn installed. Install dependencies with:

```bash
yarn
```

Once it's done start up the bot with:

```bash
yarn start
```

To run tests:

```bash
yarn test
```

## Commands

Command | Options | Description
--- | --- | ---
   /catalog | `format` `event_type` `date` | (WIP) Displays most recent events by format, type, and/or date.
   /debug | | Displays the bot's current uptime, cluster info, and latency.
   /decklist | `decklist_url` | (WIP) Display decklist(s) by url or filtered by format, archetype, player, and/or query.
   /event | `event_id` `view (optional)` | (WIP) Displays an event by name, id, date, or search query.
   /help | *none* | Displays this bot's commands.
   /hypergeo | `pop_size` `pop_successes` `sample_size` `desired_successes` | Solves a hypergeometric distribution.
   /quote | `message_link` | Quotes a message by a provided message link.

## /catalog
(WIP) Displays most recent events by format, type, and/or date.

Usage: `/catalog format: modern event_type: challenge date: 07/04/2021`
## /debug
Displays the bot's current uptime, cluster info, and latency.

Usage: `/debug`
## /decklist
(WIP) Display decklist(s) by url or filtered by format, archetype, player, and/or query.

Usage: `/decklist decklist_url: https://www.mtggoldfish.com/deck/432172#paper`
## /event
(WIP) Displays an event by name, id, date, or search query.

Usage: `/event event_id: 12299475 view: Decklist View`
## /help
Displays a list of this bot's commands.

Usage: `/help`
## /hypergeo
Solves a hypergeometric distribution.

Usage: `/hypergeo pop_size: 60 pop_successes: 24 sample_size: 7 desired_successes: 4`
## /quote
Quotes a message by a provided message link.

Usage: `/quote message_link:https://discord.com/channels/772093785176801310/810281825691107389/863256006887473162`
