import { expect } from 'chai';

import { Federation } from '../../../../../../app/federation-v2/client/Federation';
import { RoomMemberActions } from '../../../../../../definition/IRoomTypeConfig';

describe('Federation[Client] - Federation', () => {
	describe('#federationActionAllowed()', () => {
		const allowedActions = [RoomMemberActions.REMOVE_USER];

		Object.values(RoomMemberActions)
			.filter((action) => !allowedActions.includes(action as any))
			.forEach((action) => {
				it('should return false if the action is NOT allowed within the federation context', () => {
					expect(Federation.federationActionAllowed(action)).to.be.false;
				});
			});

		allowedActions.forEach((action) => {
			it('should return true if the action is allowed within the federation context', () => {
				expect(Federation.federationActionAllowed(action)).to.be.true;
			});
		});
	});
});