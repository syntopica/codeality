/// [name] with its first character uppercased.
func upperCamel(_ name: String) -> String {
    name.prefix(1).uppercased() + name.dropFirst()
}
