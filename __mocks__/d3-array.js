// Mock for d3-array
module.exports = {
  extent: jest.fn().mockReturnValue([0, 10]),
  max: jest.fn().mockReturnValue(10),
  min: jest.fn().mockReturnValue(0),
};