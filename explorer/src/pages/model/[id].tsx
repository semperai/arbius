import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
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
import { Model, ModelSchema, Task } from '@/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
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

export default function ModelDetail() {
  const router = useRouter();
  const { id } = router.query;

  const [loading, setLoading] = useState(true);
  const [model, setModel] = useState<Model | null>(null);
  const [schema, setSchema] = useState<ModelSchema | null>(null);
  const [taskCount, setTaskCount] = useState<number>(0);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchModelData() {
      if (!id || typeof id !== 'string') return;

      try {
        setLoading(true);

        // In a real implementation, you would connect to the contract and fetch data
        // const provider = new ethers.providers.JsonRpcProvider(RPC_URL);
        // const contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, provider);
        // const modelData = await contract.models(id);

        // Mock model data
        setTimeout(() => {
          const mockModel = getMockModel(id as string);
          setModel(mockModel);

          // In real implementation, you would fetch the schema from IPFS using the CID
          // For now, we'll use the mock schema
          setSchema(getMockSchema());

          // Mock task count
          setTaskCount(1248);

          setLoading(false);
        }, 1000);

      } catch (err) {
        console.error("Error fetching model data:", err);
        setError("Failed to load model data. Please try again later.");
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
    <>
      <Head>
        <title>{schema?.meta.title || model.name} | Arbius Explorer</title>
        <meta
          name="description"
          content={schema?.meta.description || `Details for Model ${model.name} on the Arbius decentralized AI system.`}
        />
      </Head>

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
            <h1 className="text-3xl font-bold">{schema?.meta.title || model.name}</h1>
            {schema?.meta.version && (
              <Badge variant="outline">v{schema.meta.version}</Badge>
            )}
          </div>
          <p className="text-muted-foreground max-w-3xl">
            {schema?.meta.description || 'No description available'}
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
                  value={truncateMiddle(id as string, 20)}
                />
                <InfoItem
                  icon={<UserIcon className="h-4 w-4" />}
                  label="Owner"
                  value={
                    <Link href={`/address/${model.addr}`} className="text-primary hover:underline">
                      {truncateMiddle(model.addr, 16)}
                    </Link>
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
                {schema?.meta.git && (
                  <InfoItem
                    icon={<FileIcon className="h-4 w-4" />}
                    label="Repository"
                    value={
                      <a
                        href={schema.meta.git}
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
                      <a
                        href={`https://ipfs.io/ipfs/${model.cid}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary hover:underline flex items-center gap-1"
                      >
                        {truncateMiddle(model.cid, 16)}
                        <ExternalLinkIcon className="h-3 w-3" />
                      </a>
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
              <Button variant="outline" className="w-full gap-2" onClick={() => router.push(`/tasks?model=${id}`)}>
                View Model Tasks <ChevronRightIcon className="h-4 w-4" />
              </Button>
            </CardFooter>
          </Card>
        </div>

        {/* Model tabs - Schema, Inputs, Outputs */}
        {schema && (
          <Tabs defaultValue="inputs" className="mb-8">
            <TabsList className="mb-4">
              <TabsTrigger value="inputs">Input Parameters</TabsTrigger>
              <TabsTrigger value="outputs">Outputs</TabsTrigger>
              {schema.meta.docker && <TabsTrigger value="docker">Implementation</TabsTrigger>}
            </TabsList>

            <TabsContent value="inputs" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Input Parameters</CardTitle>
                  <CardDescription>Configuration options for this model</CardDescription>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Parameter</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>Required</TableHead>
                        <TableHead>Default</TableHead>
                        <TableHead>Description</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {schema.input.map((input, index) => (
                        <TableRow key={index}>
                          <TableCell className="font-medium">{input.variable}</TableCell>
                          <TableCell>
                            <Badge variant="outline" className="capitalize">
                              {input.type.replace('_', ' ')}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {input.required ? (
                              <Badge>Required</Badge>
                            ) : (
                              <Badge variant="secondary">Optional</Badge>
                            )}
                          </TableCell>
                          <TableCell>
                            {input.default !== undefined && input.default !== '' ? (
                              <code className="bg-muted/40 rounded px-1 py-0.5 text-xs">
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
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Parameter Details</CardTitle>
                  <CardDescription>Expanded information about each parameter</CardDescription>
                </CardHeader>
                <CardContent>
                  <Accordion type="single" collapsible className="w-full">
                    {schema.input.map((input, index) => (
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
                            {(input.type === 'string_enum' || input.type === 'int_enum') && 'choices' in input && (
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
                    {schema.output.map((output, index) => (
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

            {schema.meta.docker && (
              <TabsContent value="docker" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Implementation Details</CardTitle>
                    <CardDescription>Technical information about the model</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {schema.meta.git && (
                        <div>
                          <h3 className="text-lg font-medium mb-2">Source Code</h3>
                          <p className="text-sm text-muted-foreground mb-2">
                            The source code for this model is available on GitHub:
                          </p>
                          <a
                            href={schema.meta.git}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-primary hover:underline"
                          >
                            {schema.meta.git}
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
                          {schema.meta.docker}
                        </code>
                      </div>

                      <Separator />

                      <div>
                        <h3 className="text-lg font-medium mb-2">Schema Information</h3>
                        <p className="text-sm text-muted-foreground mb-2">
                          The full schema for this model can be accessed via IPFS:
                        </p>
                        <a
                          href={`https://ipfs.io/ipfs/${model.cid}`}
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
            <Link href={`/tasks?model=${id}`} passHref>
              <Button variant="ghost" className="gap-1">
                View All <ChevronRightIcon className="h-4 w-4" />
              </Button>
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {mockRecentTasks.map((task) => (
              <TaskCard key={task.id} task={task} />
            ))}
          </div>
        </div>
      </div>
    </>
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

function TaskCard({ task }: { task: Task }) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-lg truncate">
          <Link href={`/tasks/${task.id}`} className="hover:text-primary transition-colors">
            {truncateMiddle(task.id, 16)}
          </Link>
        </CardTitle>
        <CardDescription>Created {task.time} ago</CardDescription>
      </CardHeader>
      <CardContent className="pb-2">
        <div className="flex flex-col space-y-1 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Owner:</span>
            <span className="font-medium truncate max-w-[180px]">{truncateMiddle(task.owner, 16)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Fee:</span>
            <span className="font-medium">{task.fee}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Status:</span>
            <TaskStatusBadge status={task.status!} />
          </div>
        </div>
      </CardContent>
      <CardFooter>
        <Link href={`/tasks/${task.id}`} passHref className="w-full">
          <Button variant="outline" className="w-full">View Details</Button>
        </Link>
      </CardFooter>
    </Card>
  );
}

function TaskStatusBadge({ status }: { status: string }) {
  const getVariant = () => {
    switch (status) {
      case 'Completed':
        return 'default';
      case 'Pending':
        return 'secondary';
      case 'Contested':
        return 'destructive';
      default:
        return 'outline';
    }
  };

  return (
    <Badge variant={getVariant()}>
      {status}
    </Badge>
  );
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

// Mock data functions - Replace these with actual data
function getMockModel(id: string): Model {
  return {
    id,
    name: 'Kandinsky 2',
    fee: ethers.parseEther('0.15'),
    addr: '0x8626f6940E2eb28930eFb4CeF49B2d1F2C9C1199',
    rate: 100,
    cid: 'QmUNLLsPACCz1vLxQVkXqqLX5R1X345qqfHbsf67hvA3Nn',
    usage: '2,345',
    successRate: 96
  };
}

function getMockSchema(): ModelSchema {
  return {
    meta: {
      title: "Kandinsky 2",
      description: "text2img model trained on LAION HighRes and fine-tuned on internal datasets",
      git: "https://github.com/kasumi-1/Kandinsky-2/tree/aa5ee2f68a1785b0833d32c27dff097b9b5e8f47",
      docker: "https://r8.im/kasumi-1/kandinsky-2@sha256:4e9a10fe1e84e0ac79c7ffabef8f66e1159dd405cd01a38750e128e7d0d52622",
      version: 1
    },
    input: [
      {
        variable: "prompt",
        type: "string",
        required: true,
        default: "",
        description: "Input prompt"
      },
      {
        variable: "num_inference_steps",
        type: "int",
        required: false,
        min: 1,
        max: 500,
        default: 100,
        description: "Number of denoising steps (minimum: 1; maximum: 500)"
      },
      {
        variable: "guidance_scale",
        type: "decimal",
        required: false,
        min: 1,
        max: 20,
        default: 4,
        description: "Scale for classifier-free guidance (minimum: 1; maximum: 20)"
      },
      {
        variable: "scheduler",
        type: "string_enum",
        required: false,
        choices: [
          "p_sampler",
          "ddim_sampler",
          "pims_sampler"
        ],
        default: "p_sampler",
        description: "Choose a scheduler."
      },
      {
        variable: "prior_cf_scale",
        type: "int",
        required: false,
        min: 1,
        max: 50,
        default: 4,
        description: ""
      },
      {
        variable: "prior_steps",
        type: "string",
        required: false,
        default: "5",
        description: ""
      },
      {
        variable: "width",
        type: "int_enum",
        required: false,
        choices: [
          256,
          512,
          768,
          1024
        ],
        default: 768,
        description: "Width of output image."
      },
      {
        variable: "height",
        type: "int_enum",
        required: false,
        choices: [
          256,
          512,
          768,
          1024
        ],
        default: 768,
        description: "Height of output image."
      }
    ],
    output: [
      {
        filename: "out-1.png",
        type: "image"
      }
    ]
  };
}

// Mock task data
const mockRecentTasks = [
  {
    id: '0x1309128093aa6234231eee34234234eff7778aa8a',
    owner: '0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D',
    fee: '0.25 AIUS',
    time: '3h',
    status: 'Completed'
  },
  {
    id: '0x2409338762aa8734231eee34298734eff7734fa8b',
    owner: '0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC',
    fee: '0.15 AIUS',
    time: '5h',
    status: 'Pending'
  },
  {
    id: '0x34093aa762aa8734231eee34298734eff7734fa8c',
    owner: '0x90F79bf6EB2c4f870365E785982E1f101E93b906',
    fee: '0.32 AIUS',
    time: '6h',
    status: 'Contested'
  }
].map((task) => ({
  ...task,
  owner: '0x1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b',
  blocktime: 1634567890,
  version: 1,
  cid: 'QmXyZaBcD1234'
}) as Task);
