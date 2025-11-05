import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.75.0'
import { corsHeaders } from '../_shared/cors.ts'

interface TaskPayload {
  project_id: string
  title: string
  description?: string
  status?: string
  priority?: string
  assigned_to?: string
  due_date?: string
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    )

    // Verificar autenticação
    const {
      data: { user },
    } = await supabaseClient.auth.getUser()

    if (!user) {
      return new Response(
        JSON.stringify({ error: 'Não autorizado' }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 401,
        }
      )
    }

    const { method, data: taskData } = await req.json()

    switch (method) {
      case 'CREATE': {
        // Validação de dados
        if (!taskData.project_id || !taskData.title) {
          return new Response(
            JSON.stringify({ error: 'Dados inválidos' }),
            {
              headers: { ...corsHeaders, 'Content-Type': 'application/json' },
              status: 400,
            }
          )
        }

        // Verificar se usuário tem permissão no projeto
        const { data: project } = await supabaseClient
          .from('projects')
          .select('id')
          .eq('id', taskData.project_id)
          .single()

        if (!project) {
          return new Response(
            JSON.stringify({ error: 'Projeto não encontrado' }),
            {
              headers: { ...corsHeaders, 'Content-Type': 'application/json' },
              status: 404,
            }
          )
        }

        // Criar tarefa
        const { data: task, error } = await supabaseClient
          .from('tasks')
          .insert({
            ...taskData,
            created_by: user.id,
          })
          .select()
          .single()

        if (error) throw error

        // Criar notificação se tarefa foi atribuída
        if (taskData.assigned_to && taskData.assigned_to !== user.id) {
          await supabaseClient.from('notifications').insert({
            user_id: taskData.assigned_to,
            title: 'Nova tarefa atribuída',
            message: `Você foi atribuído à tarefa: ${taskData.title}`,
            type: 'info',
            link: `/projects/${taskData.project_id}`,
          })
        }

        return new Response(
          JSON.stringify({ data: task }),
          {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 201,
          }
        )
      }

      case 'UPDATE': {
        if (!taskData.id) {
          return new Response(
            JSON.stringify({ error: 'ID da tarefa é obrigatório' }),
            {
              headers: { ...corsHeaders, 'Content-Type': 'application/json' },
              status: 400,
            }
          )
        }

        // Buscar tarefa atual
        const { data: currentTask } = await supabaseClient
          .from('tasks')
          .select('*')
          .eq('id', taskData.id)
          .single()

        if (!currentTask) {
          return new Response(
            JSON.stringify({ error: 'Tarefa não encontrada' }),
            {
              headers: { ...corsHeaders, 'Content-Type': 'application/json' },
              status: 404,
            }
          )
        }

        // Atualizar tarefa
        const { data: task, error } = await supabaseClient
          .from('tasks')
          .update(taskData)
          .eq('id', taskData.id)
          .select()
          .single()

        if (error) throw error

        // Notificar se status mudou para completed
        if (taskData.status === 'completed' && currentTask.status !== 'completed') {
          if (currentTask.created_by && currentTask.created_by !== user.id) {
            await supabaseClient.from('notifications').insert({
              user_id: currentTask.created_by,
              title: 'Tarefa concluída',
              message: `A tarefa "${currentTask.title}" foi concluída`,
              type: 'success',
              link: `/projects/${currentTask.project_id}`,
            })
          }
        }

        return new Response(
          JSON.stringify({ data: task }),
          {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 200,
          }
        )
      }

      case 'DELETE': {
        if (!taskData.id) {
          return new Response(
            JSON.stringify({ error: 'ID da tarefa é obrigatório' }),
            {
              headers: { ...corsHeaders, 'Content-Type': 'application/json' },
              status: 400,
            }
          )
        }

        const { error } = await supabaseClient
          .from('tasks')
          .delete()
          .eq('id', taskData.id)

        if (error) throw error

        return new Response(
          JSON.stringify({ message: 'Tarefa excluída com sucesso' }),
          {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 200,
          }
        )
      }

      default:
        return new Response(
          JSON.stringify({ error: 'Método não suportado' }),
          {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 400,
          }
        )
    }
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Erro desconhecido' }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    )
  }
})
