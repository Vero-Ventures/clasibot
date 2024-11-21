# Instructions for (1) installing a dependency for the Python lambda locally, (2) installing all dependencies in requirements.txt locally, and (3) replacing requirements.txt contents with current dependencies in ./package.

## Ensure you are in the same directory as this file before running the following commands ##

##### Command for installing dependencies into ./package ######
```shell
pip install --target=./package <new_package_name>
```

##### Command for installing all dependencies listed in requirements.txt ######
```shell
pip install -r requirements.txt -t ./package
```

##### Command for updating requirements.txt with dependencies currently in requirements.txt #####
```shell
python -m pip freeze --path ./package > requirements.txt
```