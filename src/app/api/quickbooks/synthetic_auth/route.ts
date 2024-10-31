import { NextResponse } from 'next/server';
import { ecs } from '@/lib/aws-ecs';

export async function POST(req: Request) {
  try {
    const { companyId } = await req.json();

    const response = await ecs.runTask({
      cluster: process.env.ECS_CLUSTER_NAME,
      taskDefinition: process.env.ECS_TASK_DEFINITION,
      launchType: 'FARGATE',
      networkConfiguration: {
        awsvpcConfiguration: {
          subnets: process.env.ECS_SUBNETS!.split(','),
          securityGroups: process.env.ECS_SECURITY_GROUPS!.split(','),
          assignPublicIp: 'ENABLED',
        },
      },
      overrides: {
        containerOverrides: [
          {
            name: 'syntheticAuth',
            environment: [
              {
                name: 'COMPANY_ID',
                value: companyId,
              },
              {
                name: 'BACKEND_AGENT_ID',
                value: process.env.BACKEND_AGENT_ID,
              },
            ],
          },
        ],
      },
    });

    return NextResponse.json({
      success: true,
      taskArn: response.tasks?.[0]?.taskArn,
    });
  } catch (error) {
    console.error('Failed to start ECS task:', error);
    return NextResponse.json(
      { error: 'Failed to start synthetic auth task' },
      { status: 500 }
    );
  }
}
