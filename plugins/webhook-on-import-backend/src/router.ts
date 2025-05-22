import { HttpAuthService } from '@backstage/backend-plugin-api';
import { InputError } from '@backstage/errors';
import { z } from 'zod';
import express from 'express';
import Router from 'express-promise-router';
import { TodoListService } from './services/TodoListService/types';
import { sendYamlToWebhook } from './services/WebhookService';

export async function createRouter({
  httpAuth,
  todoListService,
}: {
  httpAuth: HttpAuthService;
  todoListService: TodoListService;
}): Promise<express.Router> {
  const router = Router();
  router.use(express.json());

  // TEMPLATE NOTE:
  // Zod is a powerful library for data validation and recommended in particular
  // for user-defined schemas. In this case we use it for input validation too.
  //
  // If you want to define a schema for your API we recommend using Backstage's
  // OpenAPI tooling: https://backstage.io/docs/next/openapi/01-getting-started
  const todoSchema = z.object({
    title: z.string(),
    entityRef: z.string().optional(),
  });

  router.post('/todos', async (req, res) => {
    const parsed = todoSchema.safeParse(req.body);
    if (!parsed.success) {
      throw new InputError(parsed.error.toString());
    }

    const result = await todoListService.createTodo(parsed.data, {
      credentials: await httpAuth.credentials(req, { allow: ['user'] }),
    });

    res.status(201).json(result);
  });

  router.get('/todos', async (_req, res) => {
    res.json(await todoListService.listTodos());
  });

  router.get('/todos/:id', async (req, res) => {
    res.json(await todoListService.getTodo({ id: req.params.id }));
  });

  router.post('/send-yaml', async (req, res) => {
    const yamlContent = req.body?.yaml;
    if (!yamlContent || typeof yamlContent !== 'string') {
      res.status(400).json({ error: 'Missing or invalid YAML content in "yaml" field.' });
      return;
    }

    const webhookUrl = 'https://webhook.site/e0c5d600-12b7-491e-b73c-6a0331d25afe';

    try {
      await sendYamlToWebhook(yamlContent, webhookUrl);
      res.status(200).json({ message: 'YAML sent to webhook successfully.' });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  return router;
}
