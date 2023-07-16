import { kv } from '@vercel/kv'
import { OpenAIStream, StreamingTextResponse } from 'ai'
import { Configuration, OpenAIApi } from 'openai-edge'
import { ChatCompletionFunctions } from 'openai-edge/types/api'

import { auth } from '@/auth'
import { nanoid } from '@/lib/utils'

export const runtime = 'edge'

const duckSearch = async (query: string) => {
  const res = await fetch(
    `https://api.duckduckgo.com/?q=${encodeURIComponent(
      query
    )}&format=json&no_html=1&skip_disambig=1&no_redirect=1`
  )

  if (!res.ok) {
    return null
  }

  try {
    const json = await res.json()
    return (
      json.AbstractText ?? json.Answer ?? json.RelatedTopics[0].Text ?? null
    )
  } catch (e) {
    console.log(e)
    return null
  }
}

const googleSearch = async (query: string) => {
  const res = await fetch(
    `https://serpapi.com/search.json?q=${encodeURIComponent(
      query
    )}&engine=google&hl=en&gl=us&api_key=${process.env.SERPAPI_API_KEY}`
  )

  if (!res.ok) {
    console.log(res.status)
    return null
  }

  try {
    const json = await res.json()
    //console.log(json)
    const relatedQuestionsString = json.related_questions
      ? json.related_questions
          .map(
            (question: any) =>
              `Q: ${question.question}\nA: ${
                question.snippet
                  ? question.snippet
                  : question.list
                  ? question.list.join('\n')
                  : 'View Link to Learn More'
              }\nSource: ${question.link}`
          )
          .join('\n\n')
      : ''
    const organicResultsString = json.organic_results
      ? json.organic_results
          .map(
            (result: any) =>
              `${result.title}\n${result.snippet}\n${result.link}`
          )
          .join('\n\n')
      : ''

    const results = `Related Questions\n${relatedQuestionsString}\n\n---\n\nSearch Results\n\n${organicResultsString}`
    return results ? results : null
  } catch (e) {
    console.log(e)
    return null
  }
}

const wolframAlpha = async (query: string) => {
  const res = await fetch(
    `https://api.wolframalpha.com/v1/result?i=${encodeURIComponent(
      query
    )}&appid=${process.env.WOLFRAM_API_KEY}`
  )

  if (!res.ok) {
    console.log(res.status)
    return null
  }

  try {
    const text = await res.text()
    return text ? text : null
  } catch (e) {
    console.log(e)
    return null
  }
}

const wikipedia = async (query: string) => {
  const res = await fetch(
    `https://en.wikipedia.org/w/rest.php/v1/search/page?q=${encodeURIComponent(
      query
    )}&limit=1`
  )

  //console.log(res)

  if (!res.ok) {
    console.log(res.status)
    return null
  }

  try {
    const json = await res.json()
    //console.log(json)
    const { key } = json.pages[0]

    const pageRes = await fetch(
      `https://en.wikipedia.org/api/rest_v1/page/summary/${key}`
    )

    if (!pageRes.ok) {
      console.log(pageRes.status)
      return null
    }

    const pageJson = await pageRes.json()
    const { extract, content_urls } = pageJson

    const results = `${extract}\n\n${content_urls.desktop.page}`
    return results ? results : null
  } catch (e) {
    console.log(e)
    return null
  }
}

const functions: ChatCompletionFunctions[] = [
  {
    name: 'search',
    description:
      'Searches the web for your query. Useful for confirming facts and finding up-to-date information.',
    parameters: {
      type: 'object',
      properties: {
        query: {
          type: 'string',
          description:
            'The query to search for. Can be a question or a statement. For example, "what are french fries?" or "french fries".'
        }
      },
      required: ['query']
    }
  },
  {
    name: 'wolfram',
    description:
      'Asks Wolfram Alpha to process your query. Useful for math, science, and history questions and more.',
    parameters: {
      type: 'object',
      properties: {
        query: {
          type: 'string',
          description:
            'The query to ask. It should be phrased as a question ending in a "?". For example, "what is the capital of the United States?" or "what is the square root of 9?"'
        }
      },
      required: ['query']
    }
  },
  {
    name: 'wikipedia',
    description:
      'Searches Wikipedia for your query. Useful for learning about people, places, and things.',
    parameters: {
      type: 'object',
      properties: {
        query: {
          type: 'string',
          description:
            'The query to search for. Can be a question or a statement. For example, "what is the capital of the United States?" or "United States".'
        }
      },
      required: ['query']
    }
  }
]

const configuration = new Configuration({
  apiKey: process.env.OPENAI_API_KEY
})

const openai = new OpenAIApi(configuration)

export async function POST(req: Request) {
  const json = await req.json()
  const { messages, previewToken, model } = json
  const userId = (await auth())?.user.id
  const userName = (await auth())?.user.name?.split(' ')[0]

  if (!userId) {
    return new Response('Unauthorized', {
      status: 401
    })
  }

  if (previewToken) {
    configuration.apiKey = previewToken
  }

  const systemMessage = {
    content: `You are a friendly and helpful assistant. You are assisting ${userName} with their questions, creations, and more. You can use the search function to access the web for up-to-date information. The current time is ${new Date().toLocaleString()}. Your knowledge cutoff is September 2021.`,
    role: 'system'
  }

  const res = await openai.createChatCompletion({
    model: model ?? 'gpt-3.5-turbo-0613',
    messages: [systemMessage, ...messages],
    functions,
    temperature: 0.7,
    stream: true
  })

  const stream = OpenAIStream(res, {
    async onCompletion(completion) {
      const title = json.messages[0].content.substring(0, 100)
      const id = json.id ?? nanoid()
      const createdAt = Date.now()
      const path = `/chat/${id}`
      const payload = {
        id,
        title,
        userId,
        createdAt,
        path,
        messages: [
          ...messages,
          {
            content: completion,
            role: 'assistant'
          }
        ]
      }
      await kv.hmset(`chat:${id}`, payload)
      await kv.zadd(`user:chat:${userId}`, {
        score: createdAt,
        member: `chat:${id}`
      })
    },
    experimental_onFunctionCall: async (
      { name, arguments: args },
      createFunctionCallMessages
    ) => {
      // if you skip the function call and return nothing, the `function_call`
      // message will be sent to the client for it to handle
      if (name === 'search') {
        console.log('searching for', args.query)
        // Call search API here
        console.log('calling duckduckgo')
        let searchResults = await duckSearch((args.query as string) ?? '')
        if (searchResults === null || searchResults === '') {
          console.log('no results... calling serpapi')
          searchResults = await googleSearch((args.query as string) ?? '')
        }

        if (searchResults === null || searchResults === '') {
          searchResults =
            'Search failed. There may be an issue with the search API.'
        }

        console.log('search results', searchResults)

        // `createFunctionCallMessages` constructs the relevant "assistant" and "function" messages for you
        const newMessages = createFunctionCallMessages(searchResults)
        return openai.createChatCompletion({
          messages: [...messages, ...newMessages],
          stream: true,
          model: model ?? 'gpt-3.5-turbo-0613'
          // see "Recursive Function Calls" below
          // functions
        })
      } else if (name === 'wolfram') {
        console.log('searching wolfram for', args.query)
        // Call wolfram API here
        let searchResults = await wolframAlpha((args.query as string) ?? '')
        console.log('search results', searchResults)

        if (searchResults === null || searchResults === '') {
          searchResults =
            'Unable to answer the question. You may need to rephrase it or it may not be answerable by Wolfram Alpha.'
        }

        // `createFunctionCallMessages` constructs the relevant "assistant" and "function" messages for you
        const newMessages = createFunctionCallMessages(searchResults)
        return openai.createChatCompletion({
          messages: [...messages, ...newMessages],
          stream: true,
          model: model ?? 'gpt-3.5-turbo-0613'
          // see "Recursive Function Calls" below
          // functions
        })
      } else if (name === 'wikipedia') {
        console.log('searching wikipedia for', args.query)
        // Call wikipedia API here
        let searchResults = await wikipedia((args.query as string) ?? '')
        console.log('search results', searchResults)

        if (searchResults === null || searchResults === '') {
          searchResults =
            'Unable to find an article. You may need to rephrase your query or the article may not exist.'
        }

        // `createFunctionCallMessages` constructs the relevant "assistant" and "function" messages for you
        const newMessages = createFunctionCallMessages(searchResults)
        return openai.createChatCompletion({
          messages: [...messages, ...newMessages],
          stream: true,
          model: model ?? 'gpt-3.5-turbo-0613'
          // see "Recursive Function Calls" below
          // functions
        })
      }
    }
  })

  return new StreamingTextResponse(stream)
}
