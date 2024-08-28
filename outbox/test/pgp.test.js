const { Readable } = require('stream');
const openpgp = require('openpgp');
const PGP = require('../src/middleware/pgp');
let expect;
describe('PGP Class', () => {

  before(async () => {
    const chai = await import('chai');
    expect = chai.expect;
  });

  describe('find()', () => {
    it('should return false if the PGP key is not found', async () => {
      const result = await PGP.find('nonexistent@example.com');
      expect(result).to.be.false;
    });

    it('should return the PGP key if found', async () => {
      const result = await PGP.find('carl@carlgo11.com');
      expect(result).to.be.an('object');
      expect(result.getKeyID).to.be.a('function'); // Check if it's a valid PGP key object
    });
  });
});
