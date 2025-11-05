import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import Sidebar from "@/components/layout/Sidebar";
import Header from "@/components/layout/Header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, XCircle, Loader2 } from "lucide-react";

interface TestResult {
  operation: string;
  status: "success" | "error" | "pending" | "running";
  message: string;
  timestamp: Date;
}

const TestCrud = () => {
  const { toast } = useToast();
  const [results, setResults] = useState<TestResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [testData, setTestData] = useState({
    projectName: "Projeto Teste CRUD",
    projectDescription: "Descrição do projeto de teste",
    clientName: "Cliente Teste",
    taskTitle: "Tarefa Teste",
    taskDescription: "Descrição da tarefa de teste",
  });

  const addResult = (operation: string, status: "success" | "error" | "pending" | "running", message: string) => {
    setResults((prev) => [
      {
        operation,
        status,
        message,
        timestamp: new Date(),
      },
      ...prev,
    ]);
  };

  const testCreateProject = async () => {
    addResult("CREATE PROJECT", "pending", "Criando projeto...");
    
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        throw new Error("Usuário não autenticado");
      }

      const { data, error } = await supabase
        .from("projects")
        .insert({
          name: testData.projectName,
          description: testData.projectDescription,
          client_name: testData.clientName,
          status: "planning",
          created_by: user.id,
        })
        .select()
        .single();

      if (error) throw error;

      addResult(
        "CREATE PROJECT",
        "success",
        `Projeto criado com ID: ${data.id}`
      );
      return data.id;
    } catch (error: any) {
      addResult("CREATE PROJECT", "error", error.message);
      return null;
    }
  };

  const testReadProject = async (projectId: string) => {
    addResult("READ PROJECT", "pending", "Lendo projeto...");
    
    try {
      const { data, error } = await supabase
        .from("projects")
        .select("*")
        .eq("id", projectId)
        .single();

      if (error) throw error;

      addResult(
        "READ PROJECT",
        "success",
        `Projeto lido: ${data.name}`
      );
      return true;
    } catch (error: any) {
      addResult("READ PROJECT", "error", error.message);
      return false;
    }
  };

  const testUpdateProject = async (projectId: string) => {
    addResult("UPDATE PROJECT", "pending", "Atualizando projeto...");
    
    try {
      const { data, error } = await supabase
        .from("projects")
        .update({
          status: "in_production",
          description: "Descrição atualizada pelo teste CRUD",
        })
        .eq("id", projectId)
        .select()
        .single();

      if (error) throw error;

      addResult(
        "UPDATE PROJECT",
        "success",
        `Projeto atualizado: status = ${data.status}`
      );
      return true;
    } catch (error: any) {
      addResult("UPDATE PROJECT", "error", error.message);
      return false;
    }
  };

  const testCreateTask = async (projectId: string) => {
    addResult("CREATE TASK", "pending", "Criando tarefa...");
    
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        throw new Error("Usuário não autenticado");
      }

      const { data, error } = await supabase
        .from("tasks")
        .insert({
          project_id: projectId,
          title: testData.taskTitle,
          description: testData.taskDescription,
          status: "todo",
          priority: "high",
          created_by: user.id,
        })
        .select()
        .single();

      if (error) throw error;

      addResult(
        "CREATE TASK",
        "success",
        `Tarefa criada com ID: ${data.id}`
      );
      return data.id;
    } catch (error: any) {
      addResult("CREATE TASK", "error", error.message);
      return null;
    }
  };

  const testUpdateTask = async (taskId: string) => {
    addResult("UPDATE TASK", "pending", "Atualizando tarefa...");
    
    try {
      const { data, error } = await supabase
        .from("tasks")
        .update({
          status: "completed",
          priority: "low",
        })
        .eq("id", taskId)
        .select()
        .single();

      if (error) throw error;

      addResult(
        "UPDATE TASK",
        "success",
        `Tarefa atualizada: status = ${data.status}`
      );
      return true;
    } catch (error: any) {
      addResult("UPDATE TASK", "error", error.message);
      return false;
    }
  };

  const testDeleteTask = async (taskId: string) => {
    addResult("DELETE TASK", "pending", "Excluindo tarefa...");
    
    try {
      const { error } = await supabase
        .from("tasks")
        .delete()
        .eq("id", taskId);

      if (error) throw error;

      addResult(
        "DELETE TASK",
        "success",
        "Tarefa excluída com sucesso"
      );
      return true;
    } catch (error: any) {
      addResult("DELETE TASK", "error", error.message);
      return false;
    }
  };

  const testDeleteProject = async (projectId: string) => {
    addResult("DELETE PROJECT", "pending", "Excluindo projeto...");
    
    try {
      const { error } = await supabase
        .from("projects")
        .delete()
        .eq("id", projectId);

      if (error) throw error;

      addResult(
        "DELETE PROJECT",
        "success",
        "Projeto excluído com sucesso"
      );
      return true;
    } catch (error: any) {
      addResult("DELETE PROJECT", "error", error.message);
      return false;
    }
  };

  const runAllTests = async () => {
    setLoading(true);
    setResults([]);

    try {
      // 1. Criar projeto
      const projectId = await testCreateProject();
      if (!projectId) {
        throw new Error("Falha ao criar projeto");
      }

      await new Promise((resolve) => setTimeout(resolve, 500));

      // 2. Ler projeto
      await testReadProject(projectId);
      await new Promise((resolve) => setTimeout(resolve, 500));

      // 3. Atualizar projeto
      await testUpdateProject(projectId);
      await new Promise((resolve) => setTimeout(resolve, 500));

      // 4. Criar tarefa
      const taskId = await testCreateTask(projectId);
      if (!taskId) {
        throw new Error("Falha ao criar tarefa");
      }

      await new Promise((resolve) => setTimeout(resolve, 500));

      // 5. Atualizar tarefa
      await testUpdateTask(taskId);
      await new Promise((resolve) => setTimeout(resolve, 500));

      // 6. Excluir tarefa
      await testDeleteTask(taskId);
      await new Promise((resolve) => setTimeout(resolve, 500));

      // 7. Excluir projeto
      await testDeleteProject(projectId);

      toast({
        title: "Testes concluídos!",
        description: "Todos os testes de CRUD foram executados.",
      });
    } catch (error: any) {
      toast({
        title: "Erro nos testes",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex bg-background">
      <Sidebar />
      
      <main className="flex-1 overflow-auto">
        <Header />

        <div className="p-8 space-y-6">
          <div>
            <h1 className="text-3xl font-bold">Testes de CRUD</h1>
            <p className="text-muted-foreground mt-2">
              Execute testes automáticos de Create, Read, Update e Delete
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Dados de Teste</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="projectName">Nome do Projeto</Label>
                  <Input
                    id="projectName"
                    value={testData.projectName}
                    onChange={(e) =>
                      setTestData({ ...testData, projectName: e.target.value })
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="projectDescription">Descrição do Projeto</Label>
                  <Textarea
                    id="projectDescription"
                    value={testData.projectDescription}
                    onChange={(e) =>
                      setTestData({ ...testData, projectDescription: e.target.value })
                    }
                    rows={2}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="clientName">Nome do Cliente</Label>
                  <Input
                    id="clientName"
                    value={testData.clientName}
                    onChange={(e) =>
                      setTestData({ ...testData, clientName: e.target.value })
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="taskTitle">Título da Tarefa</Label>
                  <Input
                    id="taskTitle"
                    value={testData.taskTitle}
                    onChange={(e) =>
                      setTestData({ ...testData, taskTitle: e.target.value })
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="taskDescription">Descrição da Tarefa</Label>
                  <Textarea
                    id="taskDescription"
                    value={testData.taskDescription}
                    onChange={(e) =>
                      setTestData({ ...testData, taskDescription: e.target.value })
                    }
                    rows={2}
                  />
                </div>

                <Button
                  onClick={runAllTests}
                  disabled={loading}
                  className="w-full"
                >
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Executando Testes...
                    </>
                  ) : (
                    "Executar Todos os Testes"
                  )}
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Resultados dos Testes</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 max-h-[600px] overflow-y-auto">
                  {results.length === 0 ? (
                    <p className="text-muted-foreground text-center py-8">
                      Nenhum teste executado ainda
                    </p>
                  ) : (
                    results.map((result, index) => (
                      <div
                        key={index}
                        className="flex items-start gap-3 p-3 rounded-lg border bg-card"
                      >
                        {result.status === "success" && (
                          <CheckCircle2 className="h-5 w-5 text-green-500 mt-0.5" />
                        )}
                        {result.status === "error" && (
                          <XCircle className="h-5 w-5 text-red-500 mt-0.5" />
                        )}
                        {result.status === "pending" && (
                          <Loader2 className="h-5 w-5 text-blue-500 mt-0.5 animate-spin" />
                        )}
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-sm">
                              {result.operation}
                            </span>
                            <Badge
                              variant={
                                result.status === "success"
                                  ? "default"
                                  : result.status === "error"
                                  ? "destructive"
                                  : "secondary"
                              }
                            >
                              {result.status}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground mt-1">
                            {result.message}
                          </p>
                          <p className="text-xs text-muted-foreground mt-1">
                            {result.timestamp.toLocaleTimeString()}
                          </p>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
};

export default TestCrud;
