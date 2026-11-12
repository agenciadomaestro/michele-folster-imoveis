import { createServerFn } from '@tanstack/react-start';

// A visitor receives a capability for one new object, never a caller-selected path.
export const prepareCaptureUpload = createServerFn({ method: 'POST' })
  .handler(async () => {
    const path = `${crypto.randomUUID()}.webp`;
    const { supabaseAdmin } = await import('@/integrations/supabase/client.server');
    const { data, error } = await supabaseAdmin.storage.from('captacoes')
      .createSignedUploadUrl(path, { upsert: false });
    if (error || !data) throw new Error('Não foi possível preparar o envio da foto. Tente novamente.');
    return { path, token: data.token };
  });