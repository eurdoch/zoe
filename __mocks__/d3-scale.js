// Mock for d3-scale
module.exports = {
  scaleLinear: jest.fn(() => ({
    domain: jest.fn().mockReturnThis(),
    range: jest.fn().mockReturnThis(),
    nice: jest.fn().mockReturnThis(),
    ticks: jest.fn().mockReturnValue([0, 1, 2, 3, 4, 5]),
  })),
  scaleTime: jest.fn(() => ({
    domain: jest.fn().mockReturnThis(),
    range: jest.fn().mockReturnThis(),
    nice: jest.fn().mockReturnThis(),
    ticks: jest.fn().mockReturnValue([new Date()]),
  })),
};