# Memory Bot

Memory Bot is designed to support context-aware requests to the OpenAI API, providing unlimited context and chat history for more cost-efficient and accurate content generation.

Memory Bot can be used for a variety of purposes, including context-aware content generation, such as marketing materials, website copy, and social media content. It can also be used for document-based question answering (DBQA), allowing you to add an unlimited amount of documents to the chatbot and ask questions such as “What was the xxx's revenue in 2021?”. This feature enables more efficient and accurate retrieval of information from your own content.

Memory Bot supports adding various types of context, such as documents, web pages and youtube videos.

This project was originally featured on my blog [ByteSizedBrainwaves - Building a GPT-4 Powered Chatbot with Node.js: Unlimited Context and Chat History in Under 100 Lines of Code
](https://medium.com/byte-sized-brainwaves/unlimited-chatbot-context-and-chat-history-in-under-100-lines-of-code-with-langchain-and-node-js-1190fcc20708).

## Features

### Configurable Context Retrieval

Memory Bot enables users to save costs by sending only relevant context in the prompt. It allows loading of various types of documents, such as .txt, .md, .json, .pdf, .epub, .csv into a vector store index. This is useful for context-aware content generation or content retrieval for context-aware Q&A chatbots. Users can configure the number of relevant documents to retrieve.

### Configurable Long-Term Memory Retrieval

Memory Bot saves an unlimited amount of conversation history to a separate memory vector store index. This feature allows users to save costs by sending only relevant context in the prompt. Users can configure the number of relevant conversation parts to retrieve.

### Configurable Short-Term Memory

Memory Bot uses a short-term converstaion buffer window memory so you can refine its most recent outputs. This feature can be activated or deactivated.

### Seamlessly switch between Contexts

Memory Bot facilitates the management of concurrent projects by allowing you to create distinct Context Vector Stores for each project. This functionality enables you to segregate and organize your work efficiently. Switching between different project contexts is as simple as executing a single command. For detailed information on how to change your context store, please refer to the "/change-context-store" command under the [Commands](#commands) section.

### Daily Chat Logs

Memory Bot automatically saves all chats in daily log files in the `chat_logs` directory. This feature allows users to keep track of all conversations and review them later if needed. The log files are saved in a human-readable format and can be easily accessed and analyzed.

## Prerequisites

You will need an OpenAI Account and API key:

- Sign up for an OpenAI account here if you don't already have one: [OpenAI signup page](https://platform.openai.com/signup)
- After registering and logging in, create an API key here: [API keys](https://platform.openai.com/account/api-keys)

## Installation

1. Clone the repository or download the source code:

   ```
   git clone git@github.com:gmickel/memorybot.git
   ```

2. Navigate to the project directory:

   ```
   cd memorybot
   ```

3. Install the required dependencies:

   ```
   npm install
   ```

   Please note: On Windows, you might need to install Visual Studio first in order to properly build the hnswlib-node package. Alternatively you can use [Windows Subsystem for Linux](https://learn.microsoft.com/en-us/windows/wsl/).

4. Set up environment variables by creating a `.env` file in the project root directory with the necessary API keys and configuration options. You can use the provided `.env.example` file as a template.

   - **Important:** If you do not have access to GPT-4 yet, set the MODEL env variable to `gpt-3.5-turbo`. You can request access to GPT-4 [here](https://openai.com/waitlist/gpt-4-api).

5. Add some context to the chatbot:

   **Make sure you understand that any content you add will be sent to the OpenAI API** - see [Considerations](#considerations)

   ### Adding documents as context

   To populate the context vector index on startup, replace [example.md](docs/example.md) in the _docs_ folder with the context you want to add before starting the bot.

   You can also add new context at runtime, see [Commands](#commands) for more details.

   #### Supported document file types

   **.md**, **.txt**, **.json**, **.pdf**, **.docx**, **.epub**, **.csv**

   ### Crawling Webpages as context

   Content from Webpages can be added to the bot's context at runtime. see [Commands](#commands) for more details.

   ### Adding Youtube Video transcripts as context

   Content from Youtube Videos can be added to the bot's context at runtime. see [Commands](#commands) for more details.

6. Run the chatbot:

   ```
   npm start
   ```

## Usage

### Tweaking's memorybot's output by tuning memorybot's context and memory at runtime

By tuning the number of relevant documents returned from memorybot's vector store indexes we can tweak its behaviour.

The default values of 6 relevant context documents and 4 relevant memory documents offer a balance between searching for context in the provided context and our conversation history.

Be aware that higher values equate to sending larger (and more expensive) requests to the OpenAI API.

#### Examples

You are generating content or asking questions concerning a lengthy E-Book. It might make sense to set the number of context documents to retrieve to a high value such as 10 using `/cc 10`

You can completely deactivate either of the vector stores by setting `/cc 0` and `/mc 0` respectively.

You can also completely disable the bot's window buffer memory (its short-term transient conversation memory) by using the `/wm` command.

See the [Commands](#commands) section for more information.

### Changing the prompt

- Change the [system prompt](src/prompt.txt) to whatever you need and restart the bot.

### Resetting the chat history/context

Both the context and chat history are currently persisted and reused on every run. To reset the context simply delete the contents of the _db_ folder. To start a new conversation, resetting both the bots short-term transient and long-term vector store index memory, type the command `/reset`, see the [Commands](#commands) section for more information.

Alternatively, change the variables in .env to point to different folders.

Restart the bot after these steps.

### Running

After starting the chatbot, simply type your questions or messages and press Enter. The chatbot will respond with context-aware answers based on the conversation history and any provided context.

### Commands

<!-- COMMANDS_START -->
- `/add-docs` (/docs) - Adds new documents from your configured docs directory to the context vector store.

    Usage: /add-docs example.txt example.md

    Supports the following file types: .txt, .md, .pdf, .docx, .csv, .epub
- `/add-url` (/url) - Scrapes the content from a url and adds it to the context vector store.

    Arguments: `url`, `selector to extract` (Default: body), `Maximum number of links to follow` (Default: 20), `Ignore pages with less than n characters` (Default: 200)

    Example: /add-url https://dociq.io main 10 500

    This operation may try to generate a large number of embeddings depending on the structure of the web pages and may lead to rate-limiting.

    To avoid this, you can try to target a specific selector such as `.main`
- `/add-youtube` (/yt) - Adds the transcript from a youtube video and adds it to the context vector store.

    Arguments: `youtube url` or `youtube videoid`

    Example: /add-url https://www.youtube.com/watch?v=VMj-3S1tku0
- `/help` (/h, /?) - Show the list of available commands
- `/list-context-stores` (/lcs) - Lists all available context vector stores and their details.

- `/quit` (/q) - Terminates the script
- `/reset` - Resets the chat and starts a new conversation - This clears the memory vector store and the buffer window memory.
- `/context-config` (/cc) - Sets the number of relevant documents to return from the context vector store.

    Arguments: `number of documents` (Default: 4)

    Example: `/context-config 10`
- `/memory-config` (/mc) - Sets the number of relevant documents to return from the memory vector store.

    Arguments: `number of documents` (Default: 4)

    Example: /memory-config 10
- `/change-context-store` (/ccs) - Loads an existing or creates a new empty context vector store as a subdirectory of the db directory.

    Arguments: `subdirectory`

    Example: /change-context-store newcontext
- `/toggle-window-memory` (/wm) - Toggles the window buffer memory (MemoryBot's short-term transient memory) on or off.
<!-- COMMANDS_END -->

## Documentation

For a detailed guide on building and customizing the Bot, please refer to the blog post on [ByteSizedBrainwaves](https://bytesizedbrainwaves.hashnode.dev/series/ai-conversations).

## Considerations

Consider the implications of sharing any sensitive content with third parties. Any context or history that is generated is sent to OpenAI to create the necessary embeddings. Always ensure that you're adhering to your organization's security policies and best practices to protect your valuable assets.

## License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.

## Acknowledgements

- OpenAI for their powerful language models
- Langchain for seamless integration with language models
- HNSWLib for efficient vector search and storage
- Node.js and the open-source community for providing useful libraries and tools
