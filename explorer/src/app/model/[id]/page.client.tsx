'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ethers } from 'ethers';
import {
  ChevronRightIcon,
  ArrowLeftIcon,
  CodeIcon,
  ImageIcon,
  FileTextIcon,
  MusicIcon,
  VideoIcon,
  ExternalLinkIcon,
  UserIcon,
  InfoIcon,
  AlertTriangleIcon,
  FileIcon
} from 'lucide-react';
import { Model } from '@/types';
import { getModel, parseIPFSCid } from '@/lib/contract';
import { fetchModelTemplate, ModelTemplate } from '@/lib/templates';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { CopyButton } from '@/components/CopyButton';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Separator } from "@/components/ui/separator";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/table";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { truncateMiddle } from '@/lib/utils';

export default function ModelDetailClient({ id }: { id: string }) {
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [model, setModel] = useState<Model | null>(null);
  const [modelTemplate, setModelTemplate] = useState<ModelTemplate | null>(null);
  const [taskCount, setTaskCount] = useState<number>(0);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchModelData() {
      if (!id || typeof id !== 'string') return;

      try {
        setLoading(true);
        setError(null);

        // Fetch model from contract
        const modelData = await getModel(id);

        if (!modelData) {
          setError("Model not found. Please verify the model hash is correct.");
          setLoading(false);
          return;
        }

        // Check if model exists (addr should not be zero address)
        if (modelData.addr === ethers.ZeroAddress) {
          setError("Model not found. This model hash does not exist on the blockchain.");
          setLoading(false);
          return;
        }

        // Convert to UI format
        const modelCid = parseIPFSCid(modelData.cid) || '';

        setModel({
          id: modelData.id,
          name: `Model ${truncateMiddle(modelData.id, 8)}`, // No name in contract, use truncated ID
          addr: modelData.addr,
          fee: modelData.fee,
          rate: parseFloat(modelData.rate),
          cid: modelCid,
          usage: 0, // Task count requires an indexer
          successRate: 0 // Success rate requires an indexer
        });

        // Fetch model template using model ID (hash) - checks local cache first
        try {
          const template = await fetchModelTemplate(id);
          if (template) {
            setModelTemplate(template);
            // Update model name with template title if available
            setModel(prev => prev ? { ...prev, name: template.meta.title } : null);
          }
        } catch (err) {
          console.error('Error fetching model template:', err);
        }

        // Schema would be fetched from IPFS using the CID
        // For now, we'll note that it requires IPFS access

        // Task count requires an indexer
        setTaskCount(0);

        setLoading(false);

      } catch (err) {
        console.error("Error fetching model data:", err);
        setError("Failed to load model data. Please check your connection and try again.");
        setLoading(false);
      }
    }

    fetchModelData();
  }, [id]);

  // Display loading skeleton while data is being fetched
  if (loading) {
    return <ModelDetailSkeleton />;
  }

  // Display error if any
  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col items-center justify-center p-8">
          <AlertTriangleIcon className="h-12 w-12 text-destructive mb-4" />
          <h1 className="text-2xl font-bold mb-2">Error Loading Model</h1>
          <p className="text-muted-foreground mb-4">{error}</p>
          <Button onClick={() => router.back()}>Go Back</Button>
        </div>
      </div>
    );
  }

  // If model is null, display not found
  if (!model) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col items-center justify-center p-8">
          <AlertTriangleIcon className="h-12 w-12 text-destructive mb-4" />
          <h1 className="text-2xl font-bold mb-2">Model Not Found</h1>
          <p className="text-muted-foreground mb-4">The model ID you requested does not exist.</p>
          <Button onClick={() => router.push('/models')}>View All Models</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Breadcrumbs */}
      <Breadcrumb className="mb-6">
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink href="/">Home</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbLink href="/models">Models</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbLink>{model.name}</BreadcrumbLink>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      {/* Back button */}
      <div className="mb-6">
        <Button
          variant="outline"
          onClick={() => router.back()}
          size="sm"
          className="gap-2"
        >
          <ArrowLeftIcon className="h-4 w-4" /> Back
        </Button>
      </div>

      {/* Header with Model name */}
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-2">
          <h1 className="text-3xl font-bold">{modelTemplate?.meta.title || model.name}</h1>
          {modelTemplate?.meta.version && (
            <Badge variant="outline">v{modelTemplate.meta.version}</Badge>
          )}
        </div>
        <p className="text-muted-foreground max-w-3xl">
          {modelTemplate?.meta.description || 'No description available'}
        </p>
      </div>

      {/* Model Information Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Model Information</CardTitle>
            <CardDescription>Basic details about this model</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <InfoItem
                icon={<CodeIcon className="h-4 w-4" />}
                label="Model Hash"
                value={
                  <div className="flex items-center gap-1">
                    <span>{truncateMiddle(id as string, 20)}</span>
                    <CopyButton text={id as string} label="Copy model hash" size="icon" />
                  </div>
                }
              />
              <InfoItem
                icon={<UserIcon className="h-4 w-4" />}
                label="Owner"
                value={
                  <div className="flex items-center gap-1">
                    <Link href={`/address/${model.addr}`} className="text-primary hover:underline">
                      {truncateMiddle(model.addr, 16)}
                    </Link>
                    <CopyButton text={model.addr} label="Copy owner address" size="icon" />
                  </div>
                }
              />
              <InfoItem
                icon={<InfoIcon className="h-4 w-4" />}
                label="Base Fee"
                value={`${ethers.formatEther(model.fee)} AIUS`}
              />
              <InfoItem
                icon={<InfoIcon className="h-4 w-4" />}
                label="Reward Rate"
                value={model.rate.toString()}
              />
              {modelTemplate?.meta.git && (
                <InfoItem
                  icon={<FileIcon className="h-4 w-4" />}
                  label="Repository"
                  value={
                    <a
                      href={modelTemplate.meta.git}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary hover:underline flex items-center gap-1"
                    >
                      GitHub Repository
                      <ExternalLinkIcon className="h-3 w-3" />
                    </a>
                  }
                />
              )}
              {model.cid && (
                <InfoItem
                  icon={<FileTextIcon className="h-4 w-4" />}
                  label="IPFS CID"
                  value={
                    <div className="flex items-center gap-1">
                      <a
                        href={`https://ipfs.arbius.org/ipfs/${model.cid}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary hover:underline flex items-center gap-1"
                      >
                        {truncateMiddle(model.cid, 16)}
                        <ExternalLinkIcon className="h-3 w-3" />
                      </a>
                      <CopyButton text={model.cid} label="Copy IPFS CID" size="icon" />
                    </div>
                  }
                />
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Usage Statistics</CardTitle>
            <CardDescription>Performance and utilization</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Total Tasks:</span>
                <span className="font-medium">{taskCount.toLocaleString()}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Success Rate:</span>
                <span className="font-medium">96%</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Average Processing Time:</span>
                <span className="font-medium">23s</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Active Since:</span>
                <span className="font-medium">Mar 12, 2025</span>
              </div>
            </div>
          </CardContent>
          <CardFooter>
            <Button variant="outline" className="w-full gap-2" onClick={() => router.push(`/model/${id}/tasks`)}>
              View Model Tasks <ChevronRightIcon className="h-4 w-4" />
            </Button>
          </CardFooter>
        </Card>
      </div>

      {/* Model tabs - Template, Inputs, Outputs */}
      {modelTemplate && (
        <Tabs defaultValue="inputs" className="mb-8">
          <TabsList className="mb-4 w-full sm:w-auto overflow-x-auto flex-nowrap">
            <TabsTrigger value="inputs" className="whitespace-nowrap">Input Parameters</TabsTrigger>
            <TabsTrigger value="outputs" className="whitespace-nowrap">Outputs</TabsTrigger>
            {modelTemplate.meta.docker && <TabsTrigger value="docker" className="whitespace-nowrap">Implementation</TabsTrigger>}
          </TabsList>

          <TabsContent value="inputs" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Input Parameters</CardTitle>
                <CardDescription>Configuration options for this model</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="min-w-[120px]">Parameter</TableHead>
                        <TableHead className="min-w-[100px]">Type</TableHead>
                        <TableHead className="min-w-[100px]">Required</TableHead>
                        <TableHead className="min-w-[100px]">Default</TableHead>
                        <TableHead className="min-w-[200px]">Description</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {modelTemplate.input.map((input, index) => (
                        <TableRow key={index}>
                          <TableCell className="font-medium">{input.variable}</TableCell>
                          <TableCell>
                            <Badge variant="outline" className="capitalize whitespace-nowrap">
                              {input.type.replace('_', ' ')}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {input.required ? (
                              <Badge className="whitespace-nowrap">Required</Badge>
                            ) : (
                              <Badge variant="secondary" className="whitespace-nowrap">Optional</Badge>
                            )}
                          </TableCell>
                          <TableCell>
                            {input.default !== undefined && input.default !== '' ? (
                              <code className="bg-muted/40 rounded px-1 py-0.5 text-xs whitespace-nowrap">
                                {JSON.stringify(input.default)}
                              </code>
                            ) : (
                              <span className="text-muted-foreground">None</span>
                            )}
                          </TableCell>
                          <TableCell>{input.description || 'No description'}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Parameter Details</CardTitle>
                <CardDescription>Expanded information about each parameter</CardDescription>
              </CardHeader>
              <CardContent>
                <Accordion type="single" collapsible className="w-full">
                  {modelTemplate.input.map((input, index) => (
                    <AccordionItem value={`item-${index}`} key={index}>
                      <AccordionTrigger>
                        <div className="flex items-center gap-2">
                          <span>{input.variable}</span>
                          <Badge variant="outline" className="capitalize">
                            {input.type.replace('_', ' ')}
                          </Badge>
                        </div>
                      </AccordionTrigger>
                      <AccordionContent>
                        <div className="space-y-2 pt-2">
                          <p className="text-sm">{input.description || 'No description provided.'}</p>

                          {/* Display type-specific information */}
                          {(input.type === 'int' || input.type === 'decimal') && (
                            <div className="text-sm text-muted-foreground">
                              <div className="grid grid-cols-2 gap-2">
                                {'min' in input && (
                                  <div>
                                    <span className="font-medium">Minimum:</span> {input.min}
                                  </div>
                                )}
                                {'max' in input && (
                                  <div>
                                    <span className="font-medium">Maximum:</span> {input.max}
                                  </div>
                                )}
                              </div>
                            </div>
                          )}

                          {/* Display choices for enum types */}
                          {(input.type === 'string_enum' || input.type === 'int_enum') && input.choices && (
                            <div className="mt-2">
                              <span className="text-sm font-medium">Available options:</span>
                              <div className="flex flex-wrap gap-2 mt-1">
                                {input.choices.map((choice, idx) => (
                                  <Badge variant="secondary" key={idx}>
                                    {choice.toString()}
                                  </Badge>
                                ))}
                              </div>
                            </div>
                          )}

                          <div className="text-sm text-muted-foreground">
                            <span className="font-medium">Default value:</span>{' '}
                            {input.default !== undefined && input.default !== '' ? (
                              <code className="bg-muted/40 rounded px-1 py-0.5 text-xs">
                                {JSON.stringify(input.default)}
                              </code>
                            ) : (
                              'None'
                            )}
                          </div>
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="outputs" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Model Outputs</CardTitle>
                <CardDescription>Files produced by this model</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {modelTemplate.output.map((output, index) => (
                    <Card key={index}>
                      <CardHeader className="pb-2">
                        <div className="flex items-center justify-between">
                          <CardTitle className="text-base truncate">
                            {output.filename}
                          </CardTitle>
                          <OutputTypeIcon type={output.type} />
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="text-sm text-muted-foreground">
                          <span className="font-medium">Type:</span>{' '}
                          <Badge variant="outline" className="capitalize">
                            {output.type}
                          </Badge>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {modelTemplate.meta.docker && (
            <TabsContent value="docker" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Implementation Details</CardTitle>
                  <CardDescription>Technical information about the model</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {modelTemplate.meta.git && (
                      <div>
                        <h3 className="text-lg font-medium mb-2">Source Code</h3>
                        <p className="text-sm text-muted-foreground mb-2">
                          The source code for this model is available on GitHub:
                        </p>
                        <a
                          href={modelTemplate.meta.git}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-primary hover:underline"
                        >
                          {modelTemplate.meta.git}
                          <ExternalLinkIcon className="h-3 w-3" />
                        </a>
                      </div>
                    )}

                    <Separator />

                    <div>
                      <h3 className="text-lg font-medium mb-2">Docker Image</h3>
                      <p className="text-sm text-muted-foreground mb-2">
                        Docker image used for running this model:
                      </p>
                      <code className="block p-3 bg-muted/40 rounded text-sm font-mono overflow-x-auto">
                        {modelTemplate.meta.docker}
                      </code>
                    </div>

                    <Separator />

                    <div>
                      <h3 className="text-lg font-medium mb-2">Schema Information</h3>
                      <p className="text-sm text-muted-foreground mb-2">
                        The full schema for this model can be accessed via IPFS:
                      </p>
                      <a
                        href={`https://ipfs.arbius.org/ipfs/${model.cid}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-primary hover:underline"
                      >
                        IPFS CID: {model.cid}
                        <ExternalLinkIcon className="h-3 w-3" />
                      </a>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          )}
        </Tabs>
      )}

      {/* Recent tasks with this model */}
      <div className="mb-8">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold">Recent Tasks</h2>
          <Link href={`/model/${id}/tasks`} passHref>
            <Button variant="ghost" className="gap-1">
              View All <ChevronRightIcon className="h-4 w-4" />
            </Button>
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div className="text-center py-8 text-muted-foreground">
            No recent task data available. Task history requires an external indexer.
          </div>
        </div>
      </div>
    </div>
  );
}

// Helper Components
function InfoItem({ icon, label, value }: { icon?: React.ReactNode; label: string; value: string | React.ReactNode }) {
  return (
    <div className="flex items-start space-x-3">
      {icon && <div className="mt-0.5 text-muted-foreground">{icon}</div>}
      <div className={icon ? "" : "w-full flex justify-between"}>
        <span className="text-muted-foreground">{label}:</span>
        <div className={icon ? "font-medium mt-1" : "font-medium text-right"}>{value}</div>
      </div>
    </div>
  );
}

function OutputTypeIcon({ type }: { type: string }) {
  switch (type) {
    case 'image':
      return <ImageIcon className="h-4 w-4 text-muted-foreground" />;
    case 'video':
      return <VideoIcon className="h-4 w-4 text-muted-foreground" />;
    case 'audio':
      return <MusicIcon className="h-4 w-4 text-muted-foreground" />;
    case 'text':
      return <FileTextIcon className="h-4 w-4 text-muted-foreground" />;
    default:
      return <FileIcon className="h-4 w-4 text-muted-foreground" />;
  }
}

function ModelDetailSkeleton() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center space-x-2 mb-6">
        <Skeleton className="h-4 w-10" />
        <Skeleton className="h-4 w-4" />
        <Skeleton className="h-4 w-14" />
        <Skeleton className="h-4 w-4" />
        <Skeleton className="h-4 w-20" />
      </div>

      <Skeleton className="h-8 w-24 mb-6" />

      <div className="mb-8">
        <Skeleton className="h-10 w-2/3 mb-4" />
        <Skeleton className="h-5 w-full max-w-xl" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        <Card className="lg:col-span-2">
          <CardHeader>
            <Skeleton className="h-6 w-48 mb-2" />
            <Skeleton className="h-4 w-64" />
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="flex justify-between">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-4 w-32" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-48 mb-2" />
            <Skeleton className="h-4 w-64" />
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="flex justify-between">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-4 w-32" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <div>
        <Skeleton className="h-10 w-full mb-8" />
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-48 mb-2" />
            <Skeleton className="h-4 w-64" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-64 w-full" />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
