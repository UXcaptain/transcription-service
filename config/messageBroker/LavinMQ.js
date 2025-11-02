import { AMQPClient } from '@cloudamqp/amqp-client'

let connection;
let channel;
let exampleDirectQueue;
let logsQueue

// Main AMQP setup function
export const connectToMessageBroker = async () => {
  try {
    // 1. Establish connection
    const amqp = new AMQPClient(process.env.LAVINMQ_HOST); 
    connection = await amqp.connect(); // Establish connection to the message broker - one connection for all channels

    // 2. Open producer and consumer channels
    channel = await connection.channel(100); // One channel for producing & consuming messages

    // 3. Declare exchanges & queues & bindings


      // 3.1 logs_exchange, logs_queue, bindings

        const logsExchange = await channel.exchangeDeclare('logs_exchange', 'topic', {
            durable: true,
            passive: false,
            autoDelete: false,
            internal: false,
          });

        logsQueue = await channel.queue('logs_queue', { // queue name
            durable: true,
            passive: false,
            autoDelete: false,
            exclusive: false,
          });

        await logsQueue.bind('logs_exchange', "logs.#", {
          // no args
        });

        // 3.2 example_exchange, example_queue, bindings // * use this as a base for queues

          //* Declare exchange
        const exampleDirectExchange = await channel.exchangeDeclare('example_direct_exchange', 'direct' , { // Name , type
            durable: true,
            passive: false,
            autoDelete: false,
            internal: false,
          })

          //* Declare queue
        exampleDirectQueue = await channel.queue('example_direct_queue', { // queue name
            durable: true,
            passive: false,
            autoDelete: false,
            exclusive: false,
          });

          //* Bind queue to exchange with routing key
        await exampleDirectQueue.bind('example_direct_exchange', 'service.action', { // queue name, exchange name, routing key // * '*' Allows for wildcard matching in routing keys - '#' allows for multiple levels of routing keys
          });
          
          //*  Note on routing keys:
          /* It a best practice to use dot notation for routing keys to represent a hierarchy of topics
          ie: 'service.action.id' where service is the service name, action is the action being performed, and id is the specific identifier - This way, you can easily filter messages based on the service, action, or specific identifier. - topic-type exchanges And use wildcards - eg: 'transcript.request.*' <-- Would request a transcript of every id
          */

    // 4. Set up producer/s
  
      // await exampleDirectQueue.publish('{"text":"hello", "id": "123", "type": "case1"}');

      // await logsQueue.publish('{"type":"event", "name": "requested AWS transcript"}');
    
  // 5. Set up consumer/s

    const consumer = await exampleDirectQueue.subscribe({ noAck: false }, async (msg) => {
      try {
        const contentStr = msg.bodyToString();
        console.log('Received message:', contentStr);
        
        const content = JSON.parse(contentStr);
        console.log('content', content)

        switch (content.type) {
          case 'case1':
            console.log('Processing case1 message')
            // doSomething();
            break;
          
          case 'case2':
            // doSomething();
            break;
          
          default:
            console.log(`[⚠️] Unknown message type: ${content.type}`);
            break;

        }

        // Acknowledge message after processing
        await msg.ack();
      } catch (err) {
        console.error("[⚠️] Error processing transcription message:", err);
        await msg.nack(true); // Requeue on failure
      }
    });
    
    console.log('service connected to LavinMQ message broker')

    return { connection: connection, channel: channel, exampleDirectExchange, exampleDirectQueue };
  } catch (e) {
    console.error("ERROR", e);
    e.connection?.close();
    setTimeout(connectToMessageBroker, 1000); // will try to reconnect in 1s
  }
}

// function for publishing to direct queue
export const publishDirect = async (message) => {
  console.log(`publishing to exampleDirectQueue message function called`);
  try {
    await exampleDirectQueue.publish(message);
  } catch (err) {
    console.error('Error publishing direct message:', err);
  }
}

// function for publishing to logs queue
export const publishLogs = async (message) => {
  console.log(`publishing to logsQueue message function called`);
  try {
    await logsQueue.publish(message);
  } catch (err) {
    console.error('Error publishing logs message:', err);
  }
}

