# Simple AI Self Browsing Browser 🤖 🌐
Experiment to build a simple AI self-browsing browser that can answer user questions by navigating to relevant websites and extracting data from them.

[![Demo](https://cdn.loom.com/sessions/thumbnails/8d832da167934f04aef3b058719fbb7a-with-play.gif)](https://www.loom.com/share/8d832da167934f04aef3b058719fbb7a?sid=8f5b9f60-5734-49f5-acd3-190a62355198)

Built with NodeJS, Typescript, OpenAI Chat GPT-3.5-turbo +, Playwright and Cheerio.


## Features

- 🛠️ Lunch a browser
- 💻 navigate to relevant website
- 📤 Extract Data to answer user question
- 🔍 If data is not found perform the website's internal search. by first finding the search box and typing in it, submitting it, and extracting data from the result page.
- 🔧 Expandable actions to be added to the bot. current capability is to extract data from the webpage and perform a search and extract data from the search result page.
## Next actions to be added
- 👆 Click on the page elements (buttons, links...) and extract data from the new page.
- ↕️ Scroll down and extract data from the new page.
- 📝 Fill out the form and submit it.
- 🗂️ Download files and extract data from them.
- 🧪 Experiment with vector search to find the most relevant data to the question.
- 🔗 Experiment with LangChain
- 🎛️ Parallel actions

## Getting started

To get started with this project, clone the repo and run the following commands:

```bash
git clone https://github.com/Husamui/AI-self-browsing-browser.git
```

Copy the .env.example into the .env file, and fill them out!

```bash
cp .env.example .env
```

Install packages
```bash
npm i
```

Run project
```bash
npm start
```