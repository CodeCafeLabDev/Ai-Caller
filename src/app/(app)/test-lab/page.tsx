
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Bot, FlaskConical, Languages, ArrowRight } from "lucide-react";

export default function TestLabPage() {
  return (
    <div className="container mx-auto py-8 space-y-8">
      <div>
        <h1 className="text-3xl font-bold font-headline flex items-center">
          <FlaskConical className="mr-3 h-8 w-8 text-primary" /> Test Lab
        </h1>
        <p className="text-muted-foreground">
          Tools for testing and simulating various aspects of your AI calling system.
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center"><Bot className="mr-2 h-6 w-6 text-primary" />Call Flow Simulation</CardTitle>
            <CardDescription>
              Visually test your campaign’s call journey step-by-step without initiating real calls.
              Ideal for verifying script logic and AI decision paths.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild>
              <Link href="/test-lab/call-flow">
                Go to Call Flow Simulation <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center"><Languages className="mr-2 h-6 w-6 text-primary" />Voice Bot Testing</CardTitle>
            <CardDescription>
              Preview Text-to-Speech (TTS) outputs, simulate audio conversations, and evaluate
              voice bot performance including STT accuracy and fallback triggers.
            </CardDescription>
          </CardHeader>
          <CardContent>
             <Button asChild>
              <Link href="/test-lab/voice-bot-testing">
                Go to Voice Bot Testing <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
       <Card className="mt-8">
            <CardHeader>
                <CardTitle>About the Test Lab</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground space-y-2">
                <p>The Test Lab provides a suite of tools designed to help you thoroughly vet your AI voice agent configurations before they go live. By simulating interactions and testing individual components, you can ensure a high-quality experience for your end-users and catch potential issues early in the development cycle.</p>
                <p>Use the Call Flow Simulation to walk through conversational scripts and verify branching logic. Utilize Voice Bot Testing to fine-tune TTS outputs, assess STT interpretation, and check the robustness of your voice agent's responses.</p>
            </CardContent>
        </Card>
    </div>
  );
}
