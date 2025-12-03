import { Kiro } from '@kiro/runtime';
import { FileSystem } from '@kiro/fs';
import { Hook } from '@kiro/hooks';
import * as fs from 'fs';
import * as path from 'path';

/**
 * CSV Automation Bot - Main Workflow
 * Automates boring data organization tasks
 */

interface DataRow {
  id: string;
  name: string;
  category: string;
  timestamp: string;
  processed: boolean;
}

class CSVAutomationBot {
  private kiro: Kiro;
  private fs: FileSystem;
  private outputDir: string = './data/output';
  private inputDir: string = './data/input';
  private processedCount: number = 0;

  constructor() {
    this.kiro = new Kiro();
    this.fs = new FileSystem();
  }

  /**
   * Main automation workflow
   */
  async runAutomation(): Promise<void> {
    console.log('\n🤖 Starting CSV Automation Workflow...');
    
    try {
      // Step 1: Initialize directories
      await this.initializeDirectories();
      
      // Step 2: Read and process input files
      const data = await this.readInputFiles();
      
      // Step 3: Clean and validate data
      const cleanedData = await this.cleanData(data);
      
      // Step 4: Organize and categorize
      const organizedData = await this.organizeData(cleanedData);
      
      // Step 5: Generate CSV output
      await this.generateCSVOutput(organizedData);
      
      // Step 6: Archive processed files
      await this.archiveProcessedFiles();
      
      // Step 7: Generate final report
      await this.generateReport();
      
      console.log('\n✅ Automation completed successfully!');
      console.log(`📊 Total records processed: ${this.processedCount}`);
    } catch (error) {
      console.error('❌ Automation failed:', error);
      throw error;
    }
  }

  /**
   * Initialize required directories
   */
  private async initializeDirectories(): Promise<void> {
    console.log('\n📁 Initializing directories...');
    
    if (!fs.existsSync(this.inputDir)) {
      fs.mkdirSync(this.inputDir, { recursive: true });
      console.log(`Created input directory: ${this.inputDir}`);
    }
    
    if (!fs.existsSync(this.outputDir)) {
      fs.mkdirSync(this.outputDir, { recursive: true });
      console.log(`Created output directory: ${this.outputDir}`);
    }
  }

  /**
   * Read input files and extract data
   */
  private async readInputFiles(): Promise<DataRow[]> {
    console.log('\n📖 Reading input files...');
    const data: DataRow[] = [];
    
    const files = fs.readdirSync(this.inputDir);
    for (const file of files) {
      if (file.endsWith('.csv') || file.endsWith('.json')) {
        const filePath = path.join(this.inputDir, file);
        const content = fs.readFileSync(filePath, 'utf-8');
        const parsedData = this.parseData(content, file);
        data.push(...parsedData);
      }
    }
    
    console.log(`✓ Read ${data.length} records from input files`);
    return data;
  }

  /**
   * Parse data based on file type
   */
  private parseData(content: string, filename: string): DataRow[] {
    const rows: DataRow[] = [];
    
    if (filename.endsWith('.json')) {
      const parsed = JSON.parse(content);
      const items = Array.isArray(parsed) ? parsed : [parsed];
      return items.map((item, idx) => ({
        id: item.id || `row_${idx}`,
        name: item.name || 'Unknown',
        category: item.category || 'Uncategorized',
        timestamp: new Date().toISOString(),
        processed: false
      }));
    }
    
    return rows;
  }

  /**
   * Clean and validate data
   */
  private async cleanData(data: DataRow[]): Promise<DataRow[]> {
    console.log('\n🧹 Cleaning data...');
    
    // Remove duplicates
    const unique = Array.from(new Map(data.map(d => [d.id, d])).values());
    
    // Validate required fields
    const validated = unique.filter(row => 
      row.id && row.name && row.category
    );
    
    console.log(`✓ Cleaned ${data.length} → ${validated.length} records`);
    return validated;
  }

  /**
   * Organize and categorize data
   */
  private async organizeData(data: DataRow[]): Promise<Map<string, DataRow[]>> {
    console.log('\n📚 Organizing data by category...');
    
    const organized = new Map<string, DataRow[]>();
    
    for (const row of data) {
      if (!organized.has(row.category)) {
        organized.set(row.category, []);
      }
      organized.get(row.category)!.push(row);
    }
    
    console.log(`✓ Organized into ${organized.size} categories`);
    return organized;
  }

  /**
   * Generate CSV output files
   */
  private async generateCSVOutput(organized: Map<string, DataRow[]>): Promise<void> {
    console.log('\n📝 Generating CSV output files...');
    
    for (const [category, rows] of organized) {
      const csvContent = this.convertToCSV(rows);
      const filename = `${category.toLowerCase()}_${Date.now()}.csv`;
      const filepath = path.join(this.outputDir, filename);
      
      fs.writeFileSync(filepath, csvContent);
      console.log(`✓ Created ${filename}`);
      
      this.processedCount += rows.length;
    }
  }

  /**
   * Convert data to CSV format
   */
  private convertToCSV(data: DataRow[]): string {
    const headers = 'ID,Name,Category,Timestamp,Processed';
    const rows = data.map(d => 
      `"${d.id}","${d.name}","${d.category}","${d.timestamp}",${d.processed}`
    );
    return [headers, ...rows].join('\n');
  }

  /**
   * Archive processed files
   */
  private async archiveProcessedFiles(): Promise<void> {
    console.log('\n📦 Archiving processed files...');
    
    const archiveDir = path.join(this.inputDir, 'archive');
    if (!fs.existsSync(archiveDir)) {
      fs.mkdirSync(archiveDir, { recursive: true });
    }
    
    const files = fs.readdirSync(this.inputDir);
    for (const file of files) {
      if (file.endsWith('.csv') || file.endsWith('.json')) {
        const source = path.join(this.inputDir, file);
        const dest = path.join(archiveDir, file);
        fs.renameSync(source, dest);
        console.log(`✓ Archived ${file}`);
      }
    }
  }

  /**
   * Generate final automation report
   */
  private async generateReport(): Promise<void> {
    console.log('\n📊 Generating report...');
    
    const report = {
      timestamp: new Date().toISOString(),
      totalRecordsProcessed: this.processedCount,
      outputDirectory: this.outputDir,
      status: 'SUCCESS',
      executionTime: new Date().getTime()
    };
    
    const reportPath = path.join(this.outputDir, `report_${Date.now()}.json`);
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
    console.log(`✓ Report saved to ${reportPath}`);
  }
}

// Export for use in Kiro hooks
export const automationBot = new CSVAutomationBot();
export async function executeWorkflow() {
  return automationBot.runAutomation();
}
