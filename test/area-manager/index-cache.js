'use strict';

var env = require('../env');
var Q = require('q');
var logger = require('pomelo-logger').getLogger('test', __filename);

var AreaManager = require('../../app/components/area-manager');
var IndexCache = require('../../app/components/area-manager/index-cache');

describe('index-cache test', function(){

	before(env.before);
	beforeEach(env.beforeEach);
	afterEach(env.afterEach);
	after(env.after);

	it('get/expire test', function(cb){
		var areaManager = new AreaManager({redisConfig : env.redisConfig});
		var cache = new IndexCache({
									areaManager : areaManager,
									timeout : 50
								});
		Q.fcall(function(){
			return areaManager.createArea('area1');
		}).then(function(){
			return cache.get('area1').then(function(ret){
				(ret === null).should.be.true;
			});
		}).then(function(){
			return areaManager.acquireArea('area1', 'server1');
		}).delay(20) //Wait for data sync
		.then(function(){
			return cache.get('area1').then(function(ret){
				ret.should.equal('server1');
			});
		}).delay(100) //Wait for cache expire
		.then(function(){
			return cache.get('area1').then(function(ret){
				ret.should.equal('server1');
			});
		}).then(function(){
			return areaManager.releaseArea('area1', 'server1');
		}).then(function(){
			return areaManager.removeArea('area1');
		}).delay(20)
		.then(function(){
			return cache.get('area1').fail(function(e){
				//Error is expected
				logger.debug(e);
			});
		}).done(function(){
			areaManager.close();
			cb();
		});
	});
});
