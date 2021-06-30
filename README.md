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
   /event | `event_id` `view (optional)` | (WIP) Displays an event by name, id, date, or search query.
   /help | *none* | Displays this bot's commands.

## /event
(WIP) Displays an event by name, id, date, or search query.

Usage: `/event event_id: 12299475 view: Decklist View`
## /help
Displays a list of this bot's commands.

Usage: `/help`