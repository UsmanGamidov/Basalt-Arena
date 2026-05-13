import path from 'node:path'

export default ({ env }) => {
  const client = env('DATABASE_CLIENT', 'postgres')
  if (client === 'sqlite') {
    return {
      connection: {
        client: 'sqlite',
        connection: { filename: path.join(__dirname, '..', '..', '.tmp', 'data.db') },
        useNullAsDefault: true,
      },
    }
  }

  return {
    connection: {
      client: 'postgres',
      connection: {
        host: env('DATABASE_HOST', '127.0.0.1'),
        port: env.int('DATABASE_PORT', 5432),
        database: env('DATABASE_NAME', 'basalt_cms'),
        user: env('DATABASE_USERNAME', 'basalt'),
        password: env('DATABASE_PASSWORD', 'basalt'),
        ssl: env.bool('DATABASE_SSL', false),
      },
    },
  }
}
