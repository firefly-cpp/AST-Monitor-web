import os
import unittest
import logging

if __name__ == '__main__':
    os.environ['PYTHONPATH'] = os.getcwd()

    # Configure logging
    logging.basicConfig(level=logging.INFO)

    loader = unittest.TestLoader()
    # suite = loader.discover('tests', pattern='test_coach.py')
    suite = loader.discover('tests')
    runner = unittest.TextTestRunner()
    runner.run(suite)
