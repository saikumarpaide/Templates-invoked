import fetch from 'node-fetch';

export async function sendYamlToWebhook(yamlContent: string, webhookUrl: string): Promise<void> {
  const response = await fetch(webhookUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-yaml',
    },
    body: yamlContent,
  });

  if (!response.ok) {
    throw new Error(`Failed to send YAML to webhook: ${response.status} ${response.statusText}`);
  }
}
