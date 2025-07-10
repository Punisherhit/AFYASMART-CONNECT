const axios = require('axios');

class NHIFService {
  constructor() {
    this.baseURL = process.env.NHIF_API_URL || 'https://api.nhif.or.ke/v1';
    this.apiKey = process.env.NHIF_API_KEY;
  }

  async verifyCoverage(memberNumber) {
    try {
      const response = await axios.get(`${this.baseURL}/members/${memberNumber}`, {
        headers: { 'Authorization': `Bearer ${this.apiKey}` }
      });
      return response.data;
    } catch (error) {
      console.error('NHIF verification error:', error.response?.data || error.message);
      throw new Error('Failed to verify NHIF coverage');
    }
  }

  async submitClaim(claimData) {
    try {
      const response = await axios.post(`${this.baseURL}/claims`, claimData, {
        headers: { 'Authorization': `Bearer ${this.apiKey}` }
      });
      return response.data;
    } catch (error) {
      console.error('NHIF claim submission error:', error.response?.data || error.message);
      throw new Error('Failed to submit NHIF claim');
    }
  }
}

module.exports = new NHIFService();