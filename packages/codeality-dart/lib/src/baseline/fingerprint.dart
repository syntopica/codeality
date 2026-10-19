import 'dart:convert';

import 'package:crypto/crypto.dart';

import 'fingerprint_version.dart';

/// A stable identity for a finding. The line number is deliberately left
/// out: inserting a line above a violation must not make it look new.
String fingerprint(String section, String code, String path, String context) =>
    sha256
        .convert(
          utf8.encode(
            [fingerprintVersion, section, code, path, context].join('|'),
          ),
        )
        .toString()
        .substring(0, 16);
