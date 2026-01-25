const { plainToInstance } = require('class-transformer');
require('reflect-metadata');

class CreateProjectInput {
    projectId;
    basicInfo;
}

const dtoClass = CreateProjectInput;
const dtoObject = plainToInstance(dtoClass, {});
const validKeys = Object.keys(dtoObject);

console.log('Valid Keys:', validKeys);

const reqBody = {
    projectId: 'some-uuid',
    basicInfo: { name: 'Test' }
};

const extraFields = Object.keys(reqBody).filter(key => !validKeys.includes(key));
console.log('Extra Fields detected:', extraFields);

if (extraFields.length > 0) {
    console.log('Validation would FAIL');
} else {
    console.log('Validation would PASS');
}
