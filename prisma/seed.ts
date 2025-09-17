import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seeding...');

  // Create demo users
  const adminPassword = await bcrypt.hash('admin123', 10);
  const newAdminPassword = await bcrypt.hash('admin@2365', 10);
  const userPassword = await bcrypt.hash('user123', 10);

  const adminUser = await prisma.user.upsert({
    where: { email: 'admin@example.com' },
    update: {},
    create: {
      email: 'admin@example.com',
      firstName: 'Admin',
      lastName: 'User',
      password: adminPassword,
      role: 'ADMIN',
      permissions: JSON.stringify(['read', 'write', 'delete', 'admin']),
      status: 'ACTIVE',
    },
  });

  const newAdminUser = await prisma.user.upsert({
    where: { email: 'admin@largifysolutions.com' },
    update: {},
    create: {
      email: 'admin@largifysolutions.com',
      firstName: 'Largify',
      lastName: 'Admin',
      password: newAdminPassword,
      role: 'ADMIN',
      permissions: JSON.stringify(['read', 'write', 'delete', 'admin']),
      status: 'ACTIVE',
    },
  });

  const regularUser = await prisma.user.upsert({
    where: { email: 'user@example.com' },
    update: {},
    create: {
      email: 'user@example.com',
      firstName: 'Regular',
      lastName: 'User',
      password: userPassword,
      role: 'USER',
      permissions: JSON.stringify(['read', 'write']),
      status: 'ACTIVE',
    },
  });

  // Create some sample content ideas for the users
  const sampleIdeas = [
    {
      title: '10 Tips for Remote Work Productivity',
      description: 'Share practical tips for staying productive while working from home',
      content: 'Create a comprehensive guide covering workspace setup, time management, and work-life balance strategies.',
      category: 'productivity',
      platform: 'linkedin',
      tags: ['remote-work', 'productivity', 'tips'],
      status: 'draft',
      userId: regularUser.id,
    },
    {
      title: 'The Future of AI in Business',
      description: 'Explore how artificial intelligence is transforming modern business practices',
      content: 'Discuss AI applications in various industries, benefits, challenges, and future predictions.',
      category: 'technology',
      platform: 'twitter',
      tags: ['AI', 'business', 'technology', 'future'],
      status: 'published',
      userId: adminUser.id,
    },
    {
      title: 'Sustainable Living Made Simple',
      description: 'Easy ways to adopt eco-friendly practices in daily life',
      content: 'Share actionable tips for reducing environmental impact through simple lifestyle changes.',
      category: 'lifestyle',
      platform: 'instagram',
      tags: ['sustainability', 'eco-friendly', 'lifestyle'],
      status: 'draft',
      userId: regularUser.id,
    },
    {
      title: 'Building a Personal Brand Online',
      description: 'Step-by-step guide to establishing your digital presence',
      content: 'Cover social media strategy, content creation, networking, and reputation management.',
      category: 'marketing',
      platform: 'linkedin',
      tags: ['personal-branding', 'social-media', 'marketing'],
      status: 'scheduled',
      userId: adminUser.id,
    },
  ];

  // Create sample team members
  const sampleTeamMembers = [
    {
      firstName: 'ALi',
      lastName: 'Haider',
      email: 'ali.haider@company.com',
      position: 'Full Stack Developer',
      role: 'member',
      department: 'Development',
      skills: JSON.stringify(['JavaScript', 'React', 'Node.js']),
      status: 'active',
    },
    {
      firstName: 'Sarah',
      lastName: 'Wilson',
      email: 'sarah.wilson@company.com',
      position: 'UI/UX Designer',
      role: 'lead',
      department: 'Design',
      skills: JSON.stringify(['UI/UX', 'Figma', 'Adobe Creative Suite']),
      status: 'active',
    },
    {
      firstName: 'Mike',
      lastName: 'Johnson',
      email: 'mike.johnson@company.com',
      position: 'Marketing Specialist',
      role: 'member',
      department: 'Marketing',
      skills: JSON.stringify(['Content Marketing', 'SEO', 'Analytics']),
      status: 'active',
    },
  ];

  for (const member of sampleTeamMembers) {
    const existingMember = await prisma.teamMember.findFirst({
      where: {
        email: member.email,
      },
    });

    if (!existingMember) {
      await prisma.teamMember.create({
        data: member,
      });
    }
  }

  // Create sample projects
  const sampleProjects = [
    {
      name: 'Website Redesign',
      description: 'Complete redesign of the company website with modern UI/UX',
      status: 'active',
      priority: 'high',
      startDate: new Date('2024-01-15'),
      endDate: new Date('2024-03-15'),
      budget: 50000,
    },
    {
      name: 'Mobile App Development',
      description: 'Development of iOS and Android mobile application',
      status: 'planning',
      priority: 'medium',
      startDate: new Date('2024-02-01'),
      endDate: new Date('2024-06-01'),
      budget: 75000,
    },
    {
      name: 'Marketing Campaign Q1',
      description: 'Digital marketing campaign for Q1 product launch',
      status: 'active',
      priority: 'high',
      startDate: new Date('2024-01-01'),
      endDate: new Date('2024-03-31'),
      budget: 25000,
    },
  ];

  for (const project of sampleProjects) {
    const existingProject = await prisma.project.findFirst({
      where: {
        name: project.name,
      },
    });

    if (!existingProject) {
      await prisma.project.create({
        data: project,
      });
    }
  }

  for (const idea of sampleIdeas) {
    // Check if idea already exists for this user
    const existingIdea = await prisma.contentIdea.findFirst({
      where: {
        title: idea.title,
        userId: idea.userId,
      },
    });

    if (!existingIdea) {
      await prisma.contentIdea.create({
        data: {
          ...idea,
          tags: JSON.stringify(idea.tags),
          scheduledAt: idea.status === 'scheduled' ? new Date(Date.now() + 24 * 60 * 60 * 1000) : null, // Schedule for tomorrow
        },
      });
    }
  }

  // Create sample leads
  const sampleLeads = [
    {
      name: 'John Smith',
      email: 'john.smith@techcorp.com',
      phone: '+1-555-0123',
      company: 'TechCorp Solutions',
      value: '$50,000',
      status: 'New',
      owner: 'Admin User',
      priority: 'High',
      notes: 'Interested in our enterprise software solution. Follow up next week.'
    },
    {
      name: 'Sarah Johnson',
      email: 'sarah.j@innovate.io',
      phone: '+1-555-0456',
      company: 'Innovate.io',
      value: '$25,000',
      status: 'Qualified',
      owner: 'Regular User',
      priority: 'Medium',
      notes: 'Looking for marketing automation tools. Budget approved.'
    },
    {
      name: 'Michael Chen',
      email: 'mchen@startupxyz.com',
      phone: '+1-555-0789',
      company: 'StartupXYZ',
      value: '$15,000',
      status: 'Contacted',
      owner: 'Admin User',
      priority: 'Low',
      notes: 'Early stage startup, may need custom pricing.'
    },
    {
      name: 'Emily Davis',
      email: 'emily.davis@globaltech.com',
      phone: '+1-555-0321',
      company: 'GlobalTech Industries',
      value: '$100,000',
      status: 'Proposal',
      owner: 'Largify Admin',
      priority: 'High',
      notes: 'Large enterprise deal. Proposal sent, awaiting response.'
    }
  ];

  for (const lead of sampleLeads) {
    // Check if lead already exists
    const existingLead = await prisma.lead.findFirst({
      where: {
        email: lead.email,
      },
    });

    if (!existingLead) {
      await prisma.lead.create({
        data: lead,
      });
    }
  }

  console.log('✅ Database seeding completed!');
  console.log('👤 Created users:');
  console.log('   - admin@example.com (password: admin123)');
  console.log('   - admin@largifysolutions.com (password: admin@2365)');
  console.log('   - user@example.com (password: user123)');
  console.log(`👥 Created ${sampleTeamMembers.length} sample team members`);
  console.log(`📋 Created ${sampleProjects.length} sample projects`);
  console.log(`📝 Created ${sampleIdeas.length} sample content ideas`);
  console.log(`🎯 Created ${sampleLeads.length} sample leads`);
}

main()
  .catch((e) => {
    console.error('❌ Error during seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });