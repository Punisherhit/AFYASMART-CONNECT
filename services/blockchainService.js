const { createHash } = require('crypto');
const EHR = require('../models/EHR');
const LabTest = require('../models/LabTest');
const Radiology = require('../models/Radiology');

class BlockchainService {
  constructor() {
    this.chain = [];
    this.pendingTransactions = [];
  }

  // Create SHA-256 hash
  createHash(data) {
    return createHash('sha256').update(data).digest('hex');
  }

  // Add transaction to pending pool
  addTransaction(transaction) {
    this.pendingTransactions.push(transaction);
  }

  // Mine pending transactions into a new block
  minePendingTransactions() {
    const block = {
      index: this.chain.length,
      timestamp: Date.now(),
      transactions: this.pendingTransactions,
      previousHash: this.chain.length > 0 ? this.chain[this.chain.length - 1].hash : '0',
    };

    block.hash = this.createHash(JSON.stringify(block));
    this.chain.push(block);
    this.pendingTransactions = [];
    
    return block;
  }

  // Generate audit trail for medical record
  async generateAuditTrail(recordId, recordType) {
    let record;
    
    switch(recordType) {
      case 'ehr':
        record = await EHR.findById(recordId);
        break;
      case 'lab':
        record = await LabTest.findById(recordId);
        break;
      case 'radiology':
        record = await Radiology.findById(recordId);
        break;
      default:
        throw new Error('Invalid record type');
    }
    
    if (!record) throw new Error('Record not found');
    
    const transaction = {
      recordId,
      recordType,
      action: 'access',
      timestamp: new Date(),
      user: 'system',
      hash: this.createHash(JSON.stringify(record))
    };
    
    this.addTransaction(transaction);
    this.minePendingTransactions();
    
    return {
      message: 'Audit trail recorded on blockchain',
      blockIndex: this.chain.length - 1
    };
  }

  // Verify record integrity
  async verifyRecord(recordId, recordType) {
    const record = await this.getRecord(recordId, recordType);
    const currentHash = this.createHash(JSON.stringify(record));
    
    // Find transaction in blockchain
    for (const block of this.chain) {
      const transaction = block.transactions.find(tx => 
        tx.recordId === recordId && tx.recordType === recordType
      );
      
      if (transaction) {
        return {
          verified: transaction.hash === currentHash,
          blockIndex: block.index,
          transactionTimestamp: transaction.timestamp
        };
      }
    }
    
    return { verified: false, message: 'Record not found in blockchain' };
  }

  async getRecord(recordId, recordType) {
    switch(recordType) {
      case 'ehr':
        return await EHR.findById(recordId);
      case 'lab':
        return await LabTest.findById(recordId);
      case 'radiology':
        return await Radiology.findById(recordId);
      default:
        throw new Error('Invalid record type');
    }
  }
}

module.exports = new BlockchainService();