// Cloudflare Pages Function: /api/inventory
// Compatible con Cloudflare Pages y Cloudflare Workers con KV o D1 opcional

interface Env {
  ECOPARQUE_KV?: {
    get: (key: string, options?: { type: string }) => Promise<any>;
    put: (key: string, value: string) => Promise<void>;
  };
}

export async function onRequestGet(context: { env: Env }): Promise<Response> {
  try {
    if (context.env?.ECOPARQUE_KV) {
      const inventory = await context.env.ECOPARQUE_KV.get('inventory', { type: 'json' });
      const transactions = await context.env.ECOPARQUE_KV.get('transactions', { type: 'json' });
      return new Response(JSON.stringify({
        status: 'ok',
        source: 'cloudflare_kv',
        inventory: inventory || [],
        transactions: transactions || []
      }), {
        headers: {
          'Content-Type': 'application/json; charset=utf-8',
          'Access-Control-Allow-Origin': '*',
          'Cache-Control': 'no-store'
        }
      });
    }

    return new Response(JSON.stringify({
      status: 'ok',
      source: 'cloudflare_pages',
      message: 'Cloudflare Pages Functions activo para Ecoparque Quilmes GIRSU. Modo local / client-side operativo.'
    }), {
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
        'Access-Control-Allow-Origin': '*'
      }
    });
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err?.message || 'Error en Cloudflare Function' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json; charset=utf-8' }
    });
  }
}

export async function onRequestPost(context: { request: Request; env: Env }): Promise<Response> {
  try {
    const payload = await context.request.json() as any;

    if (context.env?.ECOPARQUE_KV) {
      if (payload.action === 'saveInventory' && Array.isArray(payload.tools)) {
        await context.env.ECOPARQUE_KV.put('inventory', JSON.stringify(payload.tools));
      }
      if (payload.action === 'saveTransactions' && Array.isArray(payload.transactions)) {
        await context.env.ECOPARQUE_KV.put('transactions', JSON.stringify(payload.transactions));
      }
      return new Response(JSON.stringify({ success: true, savedInKV: true }), {
        headers: {
          'Content-Type': 'application/json; charset=utf-8',
          'Access-Control-Allow-Origin': '*'
        }
      });
    }

    return new Response(JSON.stringify({ success: true, savedInKV: false, note: 'LocalStorage sincronizado en cliente' }), {
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
        'Access-Control-Allow-Origin': '*'
      }
    });
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err?.message || 'Error al procesar petición' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json; charset=utf-8' }
    });
  }
}
