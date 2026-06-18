import { Queue, Worker, Job } from 'bullmq';
import { config } from './config';

let notificationQueue: Queue | null = null;
let webhookQueue: Queue | null = null;
let isRedisAvailable = false;

async function initQueue() {
  try {
    const connection = { url: config.redis.url };
    notificationQueue = new Queue('notifications', { connection });
    webhookQueue = new Queue('webhooks', { connection });
    isRedisAvailable = true;
  } catch {
    isRedisAvailable = false;
  }
}

async function addToQueue(queueName: 'notifications' | 'webhooks', data: any) {
  if (!isRedisAvailable) {
    process.nextTick(() => {
      if (queueName === 'notifications') handleNotification(data);
      if (queueName === 'webhooks') handleWebhook(data);
    });
    return;
  }
  const queue = queueName === 'notifications' ? notificationQueue : webhookQueue;
  if (queue) await queue.add(queueName, data);
}

async function handleNotification(data: any) {
  const { userId, type, title, message, orderId } = data;
  const { supabase } = require('./config/supabase');
  await supabase.from('notifications').insert({
    user_id: userId,
    type,
    title,
    message,
    data: { order_id: orderId },
  });
}

async function handleWebhook(data: any) {
  const { gateway, orderId, transactionId, status } = data;
  const { supabase } = require('./config/supabase');
  await supabase.from('orders').update({ status, gateway_transaction_id: transactionId }).eq('id', orderId);
  await supabase.from('transactions').insert({
    order_id: orderId,
    user_id: data.userId,
    gateway,
    gateway_transaction_id: transactionId,
    amount: data.amount,
    status,
  });
}

initQueue();

export const queueService = {
  addToQueue,
  isRedisAvailable,
};
