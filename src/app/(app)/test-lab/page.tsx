
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Bot, FlaskConical, Languages, ArrowRight, CheckSquare } from "lucide-react";
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Test Lab | Admin - AI Caller',
  description: 'Tools for testing and simulating various aspects of your AI calling system, including call flows, voice bot interactions, and script validation.',
  keywords: ['test lab', 'call flow simulation', 'voice bot testing', 'script validation', 'ai calling test', 'AI Caller admin'],
};

export default function TestLabPage() {
  const testSections = [
    {
      title: "Call Flow Simulation",
      description: "Visually test your campaign’s call journey step-by-step without initiating real calls. Ideal for verifying script logic and AI decision paths.",
      href: "/test-lab/call-flow",
      icon: Bot,
    },
    {
      title: "Voice Bot Testing",
      description: "Preview Text-to-Speech (TTS) outputs, simulate audio conversations, and evaluate voice bot performance including STT accuracy and fallback triggers.",
      href: "/test-lab/voice-bot-testing",
      icon: Languages,
    },
    {
      title: "AI Script Validation",
      description: "Scan AI script agents for logic errors, missing intents, placeholder issues, and potential infinite loops before deployment.",
      href: "/test-lab/script-validation",
      icon: CheckSquare,
    }
  ];

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

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {testSections.map((section) => {
          const IconComponent = section.icon;
          return (
            <Card key={section.title} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <CardTitle className="flex items-center text-xl"> {/* Reduced title size for consistency */}
                  <IconComponent className="mr-2 h-5 w-5 text-primary" />
                  {section.title}
                </CardTitle>
                <CardDescription>{section.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <Button asChild variant="outline">
                  <Link href={section.href}>
                    Go to {section.title.replace("AI Script Validation", "Validation Tool")} <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </div>
       <Card className="mt-8">
            <CardHeader>
                <CardTitle>About the Test Lab</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground space-y-2">
                <p>The Test Lab provides a suite of tools designed to help you thoroughly vet your AI voice agent configurations before they go live. By simulating interactions and testing individual components, you can ensure a high-quality experience for your end-users and catch potential issues early in the development cycle.</p>
                <p>Use the Call Flow Simulation to walk through conversational scripts and verify branching logic. Utilize Voice Bot Testing to fine-tune TTS outputs, assess STT interpretation, and check the robustness of your voice agent's responses. The Script Validation tool helps identify structural and logical issues in your AI agents.</p>
            </CardContent>
        </Card>
    </div>
  );
}
