[![Build Status](https://travis-ci.org/monken/node-pbac.svg?branch=master)](https://travis-ci.org/monken/node-pbac)

# node-pbac

## Installation

```
npm install pbac
```


<!-- START doctoc generated TOC please keep comment here to allow auto update -->
<!-- DON'T EDIT THIS SECTION, INSTEAD RE-RUN doctoc TO UPDATE -->
Contents

- [Global](#global)
  - [Class: PBAC](#class-pbac)
    - [PBAC.Klass()](#pbacklass)
    - [PBAC.validate(policy)](#pbacvalidatepolicy)
    - [PBAC.evaluate(object)](#pbacevaluateobject)

<!-- END doctoc generated TOC please keep comment here to allow auto update -->
# Global





* * *

## Class: PBAC


### PBAC.Klass() 

```
var PBAC = require('pbac');
var pbac = new PBAC({

});
```


### PBAC.validate(policy) 

Validates one or many policies against the schema provided in the constructor.
Will throw an error if validation fails.

**Parameters**

**policy**: `Object`, Array of policies or single policy object

**Returns**: `Bool`, Returns `true` if the policies are valid

### PBAC.evaluate(object) 

Tests an object against the policies and determines if the object passes.
The method will first try to find a policy with an explicit `Deny` for the combination of
`resource`, `action` and `condition` (matching policy). If such policy exists, `evaulate` returns false.
If there is no explicit deny the method will look for a matching policy with an explicit `Allow`.
`evaulate` will return `true` if such a policy is found. If no matching can be found at all,
`evaluate` will return `false`.

**Parameters**

**object**: `Object`, Object to test against the policies

**Returns**: `Bool`, Returns `true` if the object passes, `false` otherwise



* * *










The MIT License (MIT)

Copyright (c) 2015 Moritz Onken

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.

