const { ApolloServer, UserInputError, gql } = require('apollo-server')
const { v1:uuid } = require('uuid')


let authors = [
  {
    name: 'Robert Martin',
    id: "afa51ab0-344d-11e9-a414-719c6709cf3e",
    born: 1952,
  },
  {
    name: 'Martin Fowler',
    id: "afa5b6f0-344d-11e9-a414-719c6709cf3e",
    born: 1963
  },
  {
    name: 'Fyodor Dostoevsky',
    id: "afa5b6f1-344d-11e9-a414-719c6709cf3e",
    born: 1821
  },
  { 
    name: 'Joshua Kerievsky', // birthyear not known
    id: "afa5b6f2-344d-11e9-a414-719c6709cf3e",
  },
  { 
    name: 'Sandi Metz', // birthyear not known
    id: "afa5b6f3-344d-11e9-a414-719c6709cf3e",
  },
]

/*
 * Suomi:
 * Saattaisi olla järkevämpää assosioida kirja ja sen tekijä tallettamalla kirjan yhteyteen tekijän nimen sijaan tekijän id
 * Yksinkertaisuuden vuoksi tallennamme kuitenkin kirjan yhteyteen tekijän nimen
 *
 * English:
 * It might make more sense to associate a book with its author by storing the author's name in the context of the book instead of the author's id
 * However, for simplicity, we will store the author's name in connection with the book
*/

let books = [
  {
    title: 'Clean Code',
    published: 2008,
    author: 'Robert Martin',
    id: "afa5b6f4-344d-11e9-a414-719c6709cf3e",
    genres: ['refactoring']
  },
  {
    title: 'Agile software development',
    published: 2002,
    author: 'Robert Martin',
    id: "afa5b6f5-344d-11e9-a414-719c6709cf3e",
    genres: ['agile', 'patterns', 'design']
  },
  {
    title: 'Refactoring, edition 2',
    published: 2018,
    author: 'Martin Fowler',
    id: "afa5de00-344d-11e9-a414-719c6709cf3e",
    genres: ['refactoring']
  },
  {
    title: 'Refactoring to patterns',
    published: 2008,
    author: 'Joshua Kerievsky',
    id: "afa5de01-344d-11e9-a414-719c6709cf3e",
    genres: ['refactoring', 'patterns']
  },  
  {
    title: 'Practical Object-Oriented Design, An Agile Primer Using Ruby',
    published: 2012,
    author: 'Sandi Metz',
    id: "afa5de02-344d-11e9-a414-719c6709cf3e",
    genres: ['refactoring', 'design']
  },
  {
    title: 'Crime and punishment',
    published: 1866,
    author: 'Fyodor Dostoevsky',
    id: "afa5de03-344d-11e9-a414-719c6709cf3e",
    genres: ['classic', 'crime']
  },
  {
    title: 'The Demon ',
    published: 1872,
    author: 'Fyodor Dostoevsky',
    id: "afa5de04-344d-11e9-a414-719c6709cf3e",
    genres: ['classic', 'revolution']
  },
]

const typeDefs = gql`
  type Book {
      title: String!
      published: Int!
      author: String!
      genres: [String]
      id: ID!
  }

  type Author {
      name: String!
      bookCount: Int!
      born: Int
      id: ID!
  }

  type Query {
      bookCount: Int!
      authorCount: Int!
      allBooks(author: String, genre:String): [Book!]!
      allAuthors: [Author!]!
  }

  type Mutation {
    addBook(
      title: String!
      published: Int!
      author: String!
      genres: [String]
    ):Book
    editAuthor(
      name: String!
      setBornTo: Int!
    ):Author
  }
`

const resolvers = {
  Query: {
      bookCount: () => books.length,
      authorCount: () => authors.length,
      allBooks: (root, args) => {
        let booksByAuthor = []
        if(!args.author && !args.genre) {
          return books
        }else if(args.author && args.genre) {
          books.map(b => {
            if(b.author === args.author && b.genres.includes(args.genre)) {
              booksByAuthor = booksByAuthor.concat([b])
            }
          })
          return booksByAuthor
        }else if(args.author) {
          books.map(b => {
            if(b.author === args.author) {
              booksByAuthor = booksByAuthor.concat([b])
            }
          })
          return booksByAuthor
        }else if(args.genre) {
          books.map(b => {
            if(b.genres.includes(args.genre)) {
              booksByAuthor = booksByAuthor.concat([b])
            }
          })
          return booksByAuthor
        }else {
          return booksByAuthor
        }
      },
      allAuthors: () => authors
  },

  Book: {
    title: (root) => root.title,
    published: (root) => root.published,
    author: (root) => root.author,
    id: (root) => root.id,
    genres: (root) => root.genres
  },

  Author: {
    name: (root) => root.name,
    bookCount: (root) => {
      let mybooks = []
     books.map(b => {
        if(b.author === root.name) {
          mybooks = mybooks.concat([b])
        }
      })
     return mybooks.length
    },
    born: (root) => root.born,
    id: (root) => root.id
  },

  Mutation: {
    addBook: (root, args) => {
      if (books.find(b => b.title === args.title)) {
        throw new UserInputError('Title must be unique', {
          invalidArgs: args.title,
        })
      }
      const author = authors.find(a => a.name === args.author)
      if(!author) {
        const newAuthor = {name: args.author, id: uuid()}
        authors = authors.concat([newAuthor])
      }
      const book = {...args, id: uuid()}
      books = books.concat(book)
      return book
    },
    editAuthor: (root, args) => {
      if(!args.name || !args.setBornTo) {
        throw new UserInputError('Name and setBornTo are required', {
          invalidArgs: `${args.name} ${args.setBornTo}`
        })
      }
      const author = authors.find(a => a.name === args.name)
      if(!author) {
        return 'aye'
      }
      const updatedAuthor = {...author, born: args.setBornTo}
      authors = authors.map(a => a.name === args.name ? updatedAuthor : a)
      return updatedAuthor
    }
  }
}

const server = new ApolloServer({
  typeDefs,
  resolvers
})

server.listen().then(({ url }) => {
  console.log(`Server ready at ${url}`)
})