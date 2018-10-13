'use strict';

const proxyquire = require('proxyquire').noCallThru();
const sinon = require('sinon');
const assert = require('assert');
const mocha = require('mocha');
const util = require('./util-fake');

const defaultValidationHeader = 'Validation error:';

let utilStub;
let settings;

describe('BigStatsSettings', function () {
  describe('validateConfiguration', function () {
    // runs once before all tests in this block
    mocha.before(function (done) {
      let moduleUnderTest = '../../SRC/BigStats/nodejs/bigstats-settings';
      utilStub = sinon.createStubInstance(util);
      const BigStatsSettings = proxyquire(moduleUnderTest, { './util': utilStub });
      settings = new BigStatsSettings();
      done();
    });

    mocha.after(function (done) {
      done();
    });

    it('should be invalid', function () {
      assert.strictEqual(settings.validateConfiguration(''), false);
    });

    it('should be valid', function () {
      let json = {
        'config': {
          'destination': {
            'protocol': 'http',
            'address': '192.168.1.42',
            'port': 8080,
            'uri': '/stats'
          },
          'size': 'small',
          'interval': 10,
          'enabled': true,
          'debug': false
        }
      };

      assert.deepStrictEqual(settings.validateConfiguration(json), json);
    });

    it('should enforce minimum value for interval', function () {
      let json = {
        'config': {
          'destination': {
            'protocol': 'http',
            'address': '192.168.1.42',
            'port': 8080,
            'uri': '/stats'
          },
          'size': 'small',
          'interval': 8,
          'enabled': true,
          'debug': false
        }
      };

      assert.strictEqual(settings.validateConfiguration(json), false);
    });

    it('should use default values if not provided', function () {
      let json = {
        'config': {
          'destination': {
            'protocol': 'http',
            'address': '192.168.1.42',
            'port': 8080,
            'uri': '/stats'
          }
        }
      };

      let expectedJson = {
        'config': {
          'destination': {
            'protocol': 'http',
            'address': '192.168.1.42',
            'port': 8080,
            'uri': '/stats'
          },
          'size': 'small',
          'interval': 10,
          'enabled': true,
          'debug': false
        }
      };

      assert.deepStrictEqual(settings.validateConfiguration(json), expectedJson);
    });

    it('should fail validation if the destination object is missing', function () {
      let json = {
        'config': {
          'size': 'small',
          'interval': 10,
          'enabled': true,
          'debug': false
        }
      };

      assert.strictEqual(settings.validateConfiguration(json), false);
      sinon.assert.calledWith(utilStub.logInfo, `${defaultValidationHeader} /config should have required property 'destination'`);
    });

    it('should fail validation if the protocol property is missing', function () {
      let json = {
        'config': {
          'destination': {
            'address': '192.168.1.42',
            'port': 8080,
            'uri': '/stats'
          },
          'size': 'small',
          'interval': 10,
          'enabled': true,
          'debug': false
        }
      };

      assert.strictEqual(settings.validateConfiguration(json), false);
      sinon.assert.calledWith(utilStub.logInfo, `${defaultValidationHeader} /config/destination should have required property 'protocol'`);
    });

    it('should fail validation if the protocol property is not set to an expected value', function () {
      let json = {
        'config': {
          'destination': {
            'protocol': 'blah',
            'address': '192.168.1.42',
            'port': 8080,
            'uri': '/stats'
          },
          'size': 'small',
          'interval': 10,
          'enabled': true,
          'debug': false
        }
      };

      assert.strictEqual(settings.validateConfiguration(json), false);
      sinon.assert.calledWith(utilStub.logInfo, `${defaultValidationHeader} /config/destination/protocol should be equal to one of the allowed values. Specified value: blah (allowed value(s) are http,https,statsd,kafka`);
    });

    it('should fail validation if the protocol property is set to kafka, but the topic property is missing', function () {
      let json = {
        'config': {
          'destination': {
            'protocol': 'kafka',
            'port': 8080,
            'uri': '/stats'
          },
          'size': 'small',
          'interval': 10,
          'enabled': true,
          'debug': false
        }
      };

      assert.strictEqual(settings.validateConfiguration(json), false);
      sinon.assert.calledWith(utilStub.logInfo, `${defaultValidationHeader} /config/destination should have required property 'address'`);
    });

    it('should fail validation if the address property is missing', function () {
      let json = {
        'config': {
          'destination': {
            'protocol': 'http',
            'port': 8080,
            'uri': '/stats'
          },
          'size': 'small',
          'interval': 10,
          'enabled': true,
          'debug': false
        }
      };

      assert.strictEqual(settings.validateConfiguration(json), false);
      sinon.assert.calledWith(utilStub.logInfo, `${defaultValidationHeader} /config/destination should have required property 'address'`);
    });

    it('should fail validation if the address property is not a valid ipv4 address', function () {
      let json = {
        'config': {
          'destination': {
            'protocol': 'http',
            'address': '192.168.1.422',
            'port': 8080,
            'uri': '/stats'
          },
          'size': 'small',
          'interval': 10,
          'enabled': true,
          'debug': false
        }
      };

      assert.strictEqual(settings.validateConfiguration(json), false);
      sinon.assert.calledWith(utilStub.logInfo, `${defaultValidationHeader} /config/destination/address should match format "ipv4"`);
    });

    it('should fail validation if the port property is missing', function () {
      let json = {
        'config': {
          'destination': {
            'protocol': 'http',
            'address': '192.168.1.42',
            'uri': '/stats'
          },
          'size': 'small',
          'interval': 10,
          'enabled': true,
          'debug': false
        }
      };

      assert.strictEqual(settings.validateConfiguration(json), false);
      sinon.assert.calledWith(utilStub.logInfo, `${defaultValidationHeader} /config/destination should have required property 'port'`);
    });

    it('should enforce minimum value for port', function () {
      let json = {
        'config': {
          'destination': {
            'protocol': 'http',
            'address': '192.168.1.42',
            'port': 0,
            'uri': '/stats'
          },
          'size': 'small',
          'interval': 10,
          'enabled': true,
          'debug': false
        }
      };

      assert.strictEqual(settings.validateConfiguration(json), false);
      sinon.assert.calledWith(utilStub.logInfo, `${defaultValidationHeader} /config/destination/port should be >= 1`);
    });

    it('should enforce maximum value for port', function () {
      let json = {
        'config': {
          'destination': {
            'protocol': 'http',
            'address': '192.168.1.42',
            'port': 65536,
            'uri': '/stats'
          },
          'size': 'small',
          'interval': 10,
          'enabled': true,
          'debug': false
        }
      };

      assert.strictEqual(settings.validateConfiguration(json), false);
      sinon.assert.calledWith(utilStub.logInfo, `${defaultValidationHeader} /config/destination/port should be <= 65535`);
    });
  });
});
